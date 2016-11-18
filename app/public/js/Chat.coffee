class Chat
  messages: []
  constructor: (@userInfo, @toUserId) ->
    MicroEvent.mixin @
  startSocket: (token, chatId) ->
    socket = io.connect()
    socket.on 'connect', (->
      socket.emit 'authenticate',
        token: token
      .on 'authenticated', (->
        @chatId = chatId
        socket.emit 'join',
          userId: 2
          chatId: chatId
      ).bind(this)
      .on 'event', ((data) ->
          @.trigger data.type, data
        ).bind(@)
      .on 'unauthorized', (msg) ->
          console.log 'unauthorized: ' + JSON.stringify(msg.data)
    ).bind(@)
  start: () ->
    new Request.JSON(
      url: '/api/v1/login'
      onComplete: ((data) ->
        new Request.JSON(
          url: '/api/v1/chat/getOrCreateIdByFromToUsers'
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
      chatId: @chatId
      message: message
    )

window.Chat = Chat
