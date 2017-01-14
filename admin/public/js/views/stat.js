$(function() {
  'use strict';

  // Convert Hex to RGBA
  function convertHex(hex, opacity) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    var result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
    return result;
  }

  var chartProtoData = {
    datasets: [{
      backgroundColor: convertHex($.brandInfo, 10),
      borderColor: $.brandInfo,
      pointHoverBackgroundColor: '#fff',
      borderWidth: 2
    }]
  };

  var options = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    elements: {
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
        hoverBorderWidth: 3
      }
    }
  };

  var htmlItem = function(n) {
    return '\
      <div class="card">\
        <a name="chart-' + n + '"></a>\
        <div class="card-block">\
          <div class="row">\
            <div class="col-xs-5">\
              <h4 class="card-title" id="main-chart-title-' + n + '"></h4>\
            </div>\
          </div>\
          <div class="chart-wrapper" style="height:300px;margin-top:40px;">\
            <canvas id="main-chart-' + n + '" height="300"></canvas>\
          </div>\
        </div>\
      </div>\
    ';
  };

  var html = '';
  html += htmlItem(1);
  html += htmlItem(2);
  html += htmlItem(3);
  html += htmlItem(4);

  $('#cardsContainer').html(html);

  var submenuItemHtml = function(n, title) {
    return '<li class="nav-item">\
      <a class="nav-link" href="#chart' + n + '"><i class="icon-pie-chart"></i> ' + title + '</a>\
    </li>';
  };

  var userChartProtoData = {
    datasets: [
      {
        backgroundColor: $.brandPrimary,
        borderColor: 'rgba(255,255,255,.55)'
      }
    ]
  };
  var buildUserChart = function(d, i, color) {
    var k = i + 1;
    var data = JSON.parse(JSON.stringify(userChartProtoData));
    var chart = d.userCharts[i];
    data.labels = chart.lables;
    data.datasets[0].data = chart.data;
    data.datasets[0].backgroundColor = color;
    var ctx = $('#card-chart' + k);
    $('#userChartTitle' + k).html(chart.title);
    $('#userChartLastCount' + k).html(chart.data[chart.data.length - 1]);
    new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            gridLines: {
              color: 'transparent',
              zeroLineColor: 'transparent'
            },
            ticks: {
              fontSize: 2,
              fontColor: 'transparent',
            }

          }],
          yAxes: [{
            display: false,
            ticks: {
              display: false,
              min: Math.min.apply(Math, data.datasets[0].data) - 5,
              max: Math.max.apply(Math, data.datasets[0].data) + 5,
            }
          }],
        },
        elements: {
          line: {
            borderWidth: 1
          },
          point: {
            radius: 4,
            hitRadius: 10,
            hoverRadius: 4,
          },
        }
      }
    });
  };
  aja()
    .url('/admin/stat/data')
    .on('success', function(d) {
      var menuHtml = '';
      d.charts[0].data = d.charts[0].data.map(function(v) {
        return (v/1048576);
      });
      d.charts[1].data = d.charts[1].data.map(function(v) {
        return v/10000;
      });
      d.charts[2].data = d.charts[2].data.map(function(v) {
        return (v/1048576);
      });
      d.charts[3].data = d.charts[3].data.map(function(v) {
        return (v/1048576);
      });
      for (var i = 0; i < d.charts.length; i++) {
        menuHtml += (function(n) {
          var k = n + 1;
          var data = JSON.parse(JSON.stringify(chartProtoData));
          var chart = d.charts[n];
          data.labels = chart.lables;
          data.datasets[0].data = chart.data;
          $('#main-chart-title-' + k).html(chart.title);
          var ctx = $('#main-chart-' + k);
          new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
          });
          return submenuItemHtml(k, chart.title);
        })(i);
      }
      buildUserChart(d, 0, $.brandInfo);
      buildUserChart(d, 1, 'rgba(255,255,255,.3)');
    })
    .go();

});

