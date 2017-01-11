class AppAbstract

  constructor: (@config) ->

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