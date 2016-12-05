class Chat
  messages: []
  config: {
    baseUrl: ''
  }
  constructor: (@userInfo, @toUserId, config) ->
    MicroEvent.mixin @
    Object.assign @config, config
  restart: () ->
    @socket.disconnect()
    @socket.connect();
  startSocket: (token, chatId) ->
    @token = token
    @chatId = chatId
    if @config.baseUrl
      socket = io.connect(@config.baseUrl)
    else
      socket = io.connect()
    @socket = socket
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
    new Request(
      url: @config.baseUrl + '/api/v1/login'
      onComplete: ((data) ->
        data = JSON.parse(data)
        new Request(
          url: @config.baseUrl + '/api/v1/chat/getOrCreateByTwoUser'
          onComplete: ((chat) ->
            chat = JSON.parse(chat)
            @data = chat
            @startSocket data.token, chat.chatId
            return
          ).bind(@)
        ).get(
          fromUserId: data._id
          toUserId: @toUserId
        )).bind(@)
    ).get(@userInfo)

  sendMessage: (message) ->
    if !@chatId
      throw new Error('Chat has not started')

    new Request(
      url: @config.baseUrl + '/api/v1/message/send'
    ).get(
      token: @token
      chatId: @chatId
      message: message
    )

window.Chat = Chat
