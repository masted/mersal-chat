# cpu, memory, GC, mongo size, folder size
module.exports =

  startCollecting: (server) ->
    getSize = require 'get-folder-size'
    setInterval ->
      getSize server.config.appFolder + '/public/uploads', (err, uploadsSize) ->
        server.db.stats (err, dbStat)->
          server.db.collection('stat').insert
            time: new Date().getTime()
            memory: process.memoryUsage().rss
            cpu: process.cpuUsage().user
            dbSize: dbStat.dataSize
            uploadsSize: uploadsSize
    , 60000

  titles:
    memory: 'Memory'
    cpu: 'CPU'
    dbSize: 'Database Size'
    uploadSize: 'Uploads folder size'

  adminResultHandler: (server, res) ->
    server.db.collection('stat').find().limit(20).toArray(((err, records)->
      grids = []
      for key of @titles
        grids.push @formatGridData(key, records)
      res.send {grids: grids}
    ).bind(@))

  tts: (timestamp) ->
    date = new Date(timestamp);
    hours = date.getHours();
    minutes = "0" + date.getMinutes();
    formattedTime = hours + ':' + minutes.substr(-2)
    return formattedTime

  formatGridData: (key, records) ->
    json =
      title: @titles[key]
      lables: []
      data: []
    i = 0
    for v in records
      i++
      json.lables.push @tts(v.time)
      json.data.push v[key]
    return json

