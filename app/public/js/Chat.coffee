class Chat
  messages: []
  constructor: (@userInfo, @toUserId) ->
    MicroEvent.mixin @
  restart: () ->
    @socket.disconnect()
    @socket.connect();
  startSocket: (token, chatId) ->
    @token = token
    @chatId = chatId
    @socket = socket = io.connect()
    socket.on 'connect', (->
      socket.emit 'authenticate',
        token: token
    ).bind(@)
    socket.on 'authenticated', (->
      @chatId = chatId
      socket.emit 'join',
        chatId: chatId
    ).bind(@)
    .on 'event', ((data) ->
      console.log data
      @.trigger data.type, data
    ).bind(@)
    .on 'unauthorized', (msg) ->
      console.log 'unauthorized: ' + JSON.stringify(msg.data)
  start: () ->
    new Request.JSON(
      url: '/api/v1/login'
      onComplete: ((data) ->
        new Request.JSON(
          url: '/api/v1/chat/getOrCreateByTwoUser'
          onComplete: ((chat) ->
            @startSocket data.token, chat.chatId
            return
          ).bind(@)
        ).get(
          fromUserId: data._id
          toUserId: @toUserId
        )).bind(@)
    ).get(@.userInfo)
  sendMessage: (message) ->
    new Request(
      url: '/api/v1/message/send'
      onComplete: ((status) ->
        console.log('status: ' + status);
      ).bind(@)
    ).get(
      token: @token
      chatId: @chatId
      message: message
    )

window.Chat = Chat
