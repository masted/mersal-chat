new Request(
  url: '/dev/cleanupChat/57e9120d8e2016833717515f/580b4d3d2aa614094c58cff5',
  onComplete: ->
    user1 =
      login: 'Anton' # 57e9120d8e2016833717515f
      password: '888'
      device: 'android'

    user2 =
      login: '123123' # 580b4d3d2aa614094c58cff5
      password: 'null'
      device: 'android'

    chat1 = new Chat(user1, '580b4d3d2aa614094c58cff5')
    chat1.start()

    chat2 = new Chat(user2, '57e9120d8e2016833717515f')
    chat2.start()

    messages1 = []
    chat1.bind 'messages', (data)->
      messages1 = data.messages;

    messages2 = []
    chat2.bind 'messages', (data)->
      messages2 = data.messages;

    setTimeout(->
      chat1.sendMessage('TEST')
    , 1000)

).get()

