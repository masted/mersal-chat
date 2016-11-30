module.exports = (server) ->

  server.app.get '/admin/stat', (req, res) ->
    res.render 'admin/stat'

  server.app.get '/admin/stat/data', (req, res) ->
    require('../../stat').adminResultHandler(server, res);
