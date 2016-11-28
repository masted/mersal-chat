module.exports = (server) ->
  tts = (timestamp) ->
    date = new Date(timestamp * 1000);
    hours = date.getHours();
    minutes = "0" + date.getMinutes();
    #seconds = "0" + date.getSeconds();
    formattedTime = hours + ':' + minutes.substr(-2)
    return formattedTime

  server.app.get '/admin/stat', (req, res) ->
    res.render 'admin/stat'
  server.app.get '/admin/stat/data', (req, res) ->
    server.db.collection('stat').find().limit(20).toArray((err, r)->
      json =
        lables: []
        data: []
      i = 0
      for v in r
        i++
        json.lables.push tts(v.time)
        json.data.push v.memory
      res.send json
    )

