module.exports = (server) ->

  cAdminApp = server.express()
  cAdminApp.use server.bodyParser.urlencoded
    extended: true
  adminBasePath = server.path.normalize(server.config.appFolder + '/../../admin')
  cAdminApp.use(server.express.static(adminBasePath + '/public'))
  cAdminApp.set('view engine', 'ejs');
  cAdminApp.set('views', adminBasePath + '/views');
  cAdminApp.engine('html', require('ejs').renderFile);

  # auth
  cAdminApp.get('/auth', ((req, res) ->
    res.render 'auth.html',
      error: null
  ).bind(@))
  cAdminApp.post('/auth', ((req, res) ->
    if !req.body.password
      res.render 'auth.html',
        error: 'Password required'
      return
    if req.body.password != server.config.adminPassword
      res.render 'auth.html',
        error: 'Password required'
      return
    res.redirect '/'
  ).bind(@))

  # index
  cAdminApp.get('/', ((req, res) ->
    res.render 'index.html',
      apiUri: server.config.host + ':' + server.config.port
      adminPassword: server.config.adminPassword
  ))
  adminHttp = require('http').Server(cAdminApp)
  adminHttp.listen server.config.adminPort, (->
    console.log 'admin listening on *:' + server.config.adminPort
  )


