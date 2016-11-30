class ChatApp
  constructor: (@config) ->
  start: ->
    @initApp()
    @initMongo()
    @startHttp()
  initApp: ->
    express = require('express')
    @app = express()
    bodyParser = require('body-parser')
    path = require 'path'
    @app.use bodyParser.urlencoded
      extended: true
    @app.set 'view engine', 'jade'
    @app.use express.static path.join @config.appFolder, 'public'
    @app.get '/', ((req, res) ->
      res.sendFile(@config.appFolder + '/index.html')
    ).bind(@)
    @http = require('http').Server(@app)



    adminApp = express()
    adminApp.use(express.static(path.normalize(@config.appFolder + '/../../admin')))
    adminHttp = require('http').Server(adminApp)
    adminHttp.listen @config.adminPort, (->
      console.log 'admin listening on *:' + @config.adminPort
    ).bind(@)


  initMongo: ->
    @connectMongo(((db)->
      Server = require('./Server')
      new Server(@config, @app, db, require('socket.io')(@http), require('jsonwebtoken'))
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