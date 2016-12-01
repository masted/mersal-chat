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

  var protoData = {
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

  $('#chartsContainer').html(html);

  var submenuItemHtml = function(n, title) {
    return '<li class="nav-item">\
      <a class="nav-link" href="#chart' + n + '"><i class="icon-pie-chart"></i> ' + title + '</a>\
    </li>';
  };

  aja()
    .url('http://' + apiUri + '/admin/stat/data?password=' + adminPassword)
    .on('success', function(d) {
      var menuHtml = '';
      d.grids[0].data = d.grids[0].data.map(function(v) {
        return (v/1048576);
      });
      d.grids[1].data = d.grids[1].data.map(function(v) {
        return v/10000;
      });
      d.grids[2].data = d.grids[2].data.map(function(v) {
        return (v/1048576);
      });
      d.grids[3].data = d.grids[3].data.map(function(v) {
        return (v/1048576);
      });
      for (var i = 0; i < d.grids.length; i++) {
        menuHtml += (function(n) {
          var k = n + 1;
          var data = JSON.parse(JSON.stringify(protoData));
          var grid = d.grids[n];
          data.labels = grid.lables;
          data.datasets[0].data = grid.data;
          $('#main-chart-title-' + k).html(grid.title);
          var ctx = $('#main-chart-' + k);
          new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
          });
          return submenuItemHtml(k, grid.title);
        })(i);
      }
    })
    .go();

});

