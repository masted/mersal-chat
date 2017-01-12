class SocketEventWrapper

  constructor: (@server, @socket) ->

  event: (data) ->
    @socket.emit('event', data);
    @server.db.collection('logs').insertOne({
      dt: new Date(),
      url: data.type,
      code: 200,
      body: JSON.stringify(data),
      socket: true
    })

module.exports = SocketEventWrapper