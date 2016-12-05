EventEmitter = require("events").EventEmitter;
class Server
  constructor: (@config, @app, @db, @io, @jwt) ->
    @event = new EventEmitter();
    require('./routes/api/login')(@)
    require('./routes/api/user')(@)
    require('./routes/api/contacts')(@)
    require('./routes/api/message')(@)
    require('./routes/api/chat')(@)
    require('./routes/api/socket')(@)
    require('./routes/admin/login')(@)
    require('./routes/admin/users')(@)
    require('./routes/admin/contacts')(@)
    require('./routes/admin/stat')(@)
    require('./routes/doc')(@)
    require('./stat').startCollecting(@)
    require('./dev')(@)
    methodOverride = require('method-override')
    @app.use(methodOverride())
    @app.use((err, req, res, next) ->
      console.error(err.stack)
      res.status(404).json({error: err.message})
    )

  tokenReq: (req, res, resCallback) ->
    @addApiCors(res)
    @jwt.verify(req.query.token, @config.jwtSecret, (err, decoded) ->
      if !err
        resCallback res, decoded
      else
        res.send err
    )
  fakeTokenReq: (req, res, resCallback) ->
    user =
      _id: '57e9120d8e2016833717515f'
      id: 79202560776
      login: 'Anton'
      phone: '888'
      password: '888'
      status: 'offline'
      device: 'android'
      deviceToken: ''
    resCallback res, user
  djb2Code: (str) ->
    hash = 5381
    i = 0
    while i < str.length
      char = str.charCodeAt(i)
      hash = (hash << 5) + hash + char
      i++
    hash
  chatName: (fromUserId, toUserId) ->
    if @djb2Code(fromUserId) < @djb2Code(toUserId)
      userId1 = fromUserId
      userId2 = toUserId
    else
      userId1 = toUserId
      userId2 = fromUserId
    return 'chat-' + userId1 + '-' + userId2
  addApiCors: (res) ->
    res.header 'Access-Control-Allow-Origin', '*'

module.exports = Server