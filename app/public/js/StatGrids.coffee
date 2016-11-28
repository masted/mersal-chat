class StatGrids

  constructor: ->
    @parent = document.getElementById('container')
    @render()

  render: ->
    new Request.JSON(
      url: '/admin/stat/data'
      onComplete: ((data) ->
        console.log data
        for grid, i in data.grids
          @renderGrid(grid, i)
      ).bind(@)
    ).get()

  colors: [
    '#FF6384'
    '#36A2EB'
    '#FFCE56'
    '#cc65fe'
  ]

  renderGrid: (data, i) ->
    div = document.createElement('div')
    canvas = document.createElement('canvas')
    @parent.appendChild(div)
    div.appendChild(canvas)
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.lables,
        datasets: [{
          label: data.title,
          fill: false,
          lineTension: 0.1,
          backgroundColor: @colors[i],
          borderColor: @colors[i],
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: @colors[i],
          pointBackgroundColor: "#fff",
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: @colors[i],
          pointHoverBorderColor: @colors[i],
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: data.data,
          spanGaps: false,
        }]
      }
    })

window.StatGrids = StatGrids