module.exports = (server) ->

  cAdminApp = server.express()
  cAdminApp.use server.bodyParser.urlencoded
    extended: true
  adminBasePath = server.path.normalize(server.config.appFolder + '/../../admin')

  # -----------------------------------
  session = require 'express-session'
  MongoStore = require('connect-mongo')(session)
  mongoUrl = 'mongodb://localhost:27017/' + server.config.dbName
  cAdminApp.use session
    cookie: {maxAge: 1000 * 60 * 2}
    secret: "session secret"
    store: new MongoStore
      db: server.config.dbName
      host: '127.0.0.1'
      port: 27017
      collection: 'session'
      auto_reconnect: true
      url: mongoUrl
  # -----------------------------------

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
    req.session.admin = true
    res.redirect '/'
  ).bind(@))

  cAdminApp.get('/authStatus', ((req, res) ->
    console.log req.session
    res.json req.session
  ).bind(@))


  # index
  cAdminApp.get('/', ((req, res) ->
    console.log('!!')
    if !req.session.admin
      res.redirect '/auth'
      return
    res.render 'index.html',
      apiUri: server.config.host + ':' + server.config.port
      adminPassword: server.config.adminPassword
  ))

  adminHttp = require('http').Server(cAdminApp)
  adminHttp.listen server.config.adminPort, (->
    console.log 'admin listening on *:' + server.config.adminPort
  )


