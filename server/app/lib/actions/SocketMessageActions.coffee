MessageActions = require './MessageActions'

class SocketMessageActions

  constructor: (@server) ->
    if @called
      throw new Error('FUCK')
    @called = true
    @server.event.on 'newMessage', @newMessageEvent.bind(@) # chat server event

  newMessageEvent: (message) ->
    clients = @server.io.sockets.adapter.rooms[message.chatId]
    if !clients
      return
    if clients.sockets.length == 0
      return
    # TODO в какой ситуации для онлайн пользователя не может быть статусов? если его удалили из БД, но он всё ещё в чате
    # for each connected client
    onlineUserSockets = {}
    for socketId of clients.sockets
      socket = @server.io.sockets.connected[socketId]
      onlineUserSockets[socket.userId] = socket

    new MessageActions(@server.db).getUserMessages(message, ((userMessages) ->
      # update status "delivered" for all online users
      onlineMessageStatusIds = []
      for userMessage of userMessages
        if onlineUserSockets[userMessage.ownUserId]
          onlineMessageStatusIds.push(userMessage._id)
      # emit events
      for onlineUserId of onlineUserSockets
        onlineUserSockets[onlineUserId].emit 'event',
          type: 'newMessage'
          message: userMessages[onlineUserId]
    ).bind(@))

module.exports = SocketMessageActions