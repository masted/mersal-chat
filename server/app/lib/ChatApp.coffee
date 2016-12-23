class ChatApp
  constructor: (@config) ->
  start: ->
    @initApp()
    @initMongo()
    @startHttp()
    require('./cAdminApp')(@)
  initApp: ->
    @express = require 'express'
    @path = require 'path'
    @bodyParser = require 'body-parser'

    @app = @express()
    @app.use @bodyParser.urlencoded
      extended: true

    cors = require 'cors'
    @app.use(cors())

    @app.set 'view engine', 'jade'
    @app.set 'views', @path.normalize @config.appFolder + '/../views'
    @app.use @express.static @path.join @config.appFolder, 'public'
    @app.get '/', ((req, res) ->
      res.sendFile(@config.appFolder + '/index.html')
    ).bind(@)
    @http = require('http').Server(@app)
  initMongo: (onInit) ->
    @connectMongo(((db)->
      Server = require('./Server')
      server = new Server(@config, @app, db, require('socket.io')(@http), require('jsonwebtoken'))
      if onInit
        onInit(server)
    ).bind(@))
    @initSession()
  connectMongo: (onConnect) ->
    @mongoUrl = 'mongodb://localhost:27017/' + @config.dbName
    mongodb = require 'mongodb'
    mongoClient = mongodb.MongoClient
    mongoClient.connect @mongoUrl, ((err, db) ->
      console.log 'mongo connected'
      db.ObjectID = (id) ->
        if typeof id == 'string'
          return mongodb.ObjectID(id)
        else
          return id
      onConnect(db)
    ).bind(@)
  initSession: ->
    session = require 'express-session'
    MongoStore = require('connect-mongo')(session)
    @app.use session
      cookie: {maxAge: 1000 * 60 * 2}
      secret: "session secret"
      store: new MongoStore
        db: @config.dbName
        host: '127.0.0.1'
        port: 27017
        collection: 'session'
        auto_reconnect: true
        url: @mongoUrl
  startHttp: ->
    @http.listen @config.port, (->
      console.log 'listening on *:' + @config.port
    ).bind(@)

module.exports = ChatApp