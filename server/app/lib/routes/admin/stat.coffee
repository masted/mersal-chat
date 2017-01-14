module.exports = (app, db) ->

  app.get '/admin/stat', (req, res) ->
    res.render 'admin/stat'

  app.get '/admin/stat/data', (req, res) ->
    require('../../stat').adminResultHandler(db, req, res);
