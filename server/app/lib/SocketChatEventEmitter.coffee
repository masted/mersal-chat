class SocketChatEventEmitter

  constructor: (@server, @chatId) ->

  getChatOnlineClients: (chatId) ->
    chatClients = @server.io.sockets.adapter.rooms[chatId]
    if !chatClients
      return false
    if chatClients.sockets.length == 0
      return false
    return chatClients

  emit: (type, data)->
    clients = @getChatOnlineClients(@chatId)
    if clients == false
      return

    onlineUserSockets = {}
    for socketId of clients.sockets
      socket = @server.io.sockets.connected[socketId]
      onlineUserSockets[socket.userId] = socket

    # emit events
    data = Object.assign({type: type}, data)
    for onlineUserId of onlineUserSockets
      onlineUserSockets[onlineUserId].emit 'event', data

module.exports = SocketChatEventEmitter