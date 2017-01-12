MessageActions = require './MessageActions'
SocketEventWrapper = require '../SocketEventWrapper'

class SocketMessageActions

  constructor: (@server) ->
    if @called
      throw new Error('SocketMessageActions is singletone')
    @called = true
    @server.event.on 'newUserMessage', @newUserMessageEvent.bind(@) # direct to user

  isUserInChat: (userId, chatId) ->
    clients = @getChatOnlineClients(chatId)
    if clients == false
      return false
    for socketId of clients.sockets
      socket = @server.io.sockets.connected[socketId]
      if socket.userId == userId
        return true
    return false

  getChatOnlineClients: (chatId) ->
    chatClients = @server.io.sockets.adapter.rooms[chatId]
    if !chatClients
      return false
    if chatClients.sockets.length == 0
      return false
    return chatClients

  newUserMessageEvent: (message) ->
    if !message.toUserId
      throw new Error('massage must have toUserId')
    message.toUserId = message.toUserId + ''
    if @isUserInChat(message.toUserId) == false
      # посылаем если он не в чате
      @_newUserMessageEvent(message)
    # посылаем тем, кто в чате
    @_newChatMessageEvent(message)

  _newUserMessageEvent: (message) ->
    console.log message
    clients = @server.io.sockets.clients()
    console.log 'newUserMessage TRY TO SEND'
    for socketId of clients.connected
      if message.toUserId == clients.connected[socketId].userId
        console.log 'newUserMessage SENT'
        new SocketEventWrapper(@server, clients.connected[socketId]).event(
          type: 'newUserMessages'
          messages: [message]
        )
        #clients.connected[socketId].emit 'event',

  _newChatMessageEvent: (message) ->
    clients = @getChatOnlineClients(message.chatId)
    if clients == false
      return
    # TODO в какой ситуации для онлайн пользователя не может быть статусов? если его удалили из БД, но он всё ещё в чате
    # for each connected client
    onlineUserSockets = {}
    for socketId of clients.sockets
      socket = @server.io.sockets.connected[socketId]
      onlineUserSockets[socket.userId] = socket
    new MessageActions(@server.db).getUserMessages(message, ((userMessages) ->
      onlineMessageStatusIds = []
      for userMessage of userMessages
        if onlineUserSockets[userMessage.ownUserId]
          onlineMessageStatusIds.push(userMessage._id)
      # emit events
      for onlineUserId of onlineUserSockets
        new SocketEventWrapper(@server, onlineUserSockets[onlineUserId]).event(
          type: 'newMessage'
          message: userMessages[onlineUserId]
        )
    ).bind(@))

module.exports = SocketMessageActions