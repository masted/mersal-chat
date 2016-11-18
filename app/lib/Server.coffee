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
  tokenReq: (req, res, resCallback) ->
    @jwt.verify(req.query.token, @config.jwtSecret, (err, decoded) ->
      if !err
        resCallback res, decoded
      else
        res.send err
    )

module.exports = Server