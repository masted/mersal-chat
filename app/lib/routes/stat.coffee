# cpu, memory, GC, mongo size, folder size
module.exports (server) ->
  getSize = require 'get-folder-size'
  setInterval (->
    getSize @config.appFolder + '/public/uploads', ((err, uploadsSize) ->
      @db.stats ((err, dbStat)->
        @db.collection('stat').insert
          time: new Date().getTime()
          memory: process.memoryUsage().rss
          cpu: process.cpuUsage().user
          dbSize: dbStat.dataSize
          uploadsSize: uploadsSize
      ).bind(@)
    ).bind(@)
  ).bind(@), 60000

