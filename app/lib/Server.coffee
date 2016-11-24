class Server
  constructor: (@config, @app, @db, @io, @jwt) ->
    require('./routes/api/login')(@)
    require('./routes/api/user')(@)
    require('./routes/api/contacts')(@)
    require('./routes/api/message')(@)
    require('./routes/api/chat')(@)
    require('./routes/admin/login')(@)
    require('./routes/admin/users')(@)
    require('./routes/admin/contacts')(@)
    require('./routes/debug')(@)
    require('./socket')(@)
    require('./dev')(@)
  tokenReq: (req, res, resCallback) ->
    @jwt.verify(req.query.token, @config.jwtSecret, (err, decoded) ->
      if !err
        resCallback res, decoded
      else
        res.send err
    )
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


module.exports = Server