new Request(
  url: '/dev/cleanupChat/57e9120d8e2016833717515f/580b4d3d2aa614094c58cff5',
  onComplete: ->

    user1 =
      login: 'Anton' # 57e9120d8e2016833717515f
      password: '888'
      device: 'android'

#    user2 =
#      login: '123123' # 580b4d3d2aa614094c58cff5
#      password: 'null'
#      device: 'android'

    sent = false
    chat1 = new Chat(user1, '580b4d3d2aa614094c58cff5')
    chat1.bind 'joined', ->
      if sent
        return
      sent = true
      chat1.sendMessage 'TEST'

    chat1.start()

    chat1.bind 'newMessage', (data)->
      console.log('markAsViewed')
      new Request({
        url: '/api/v1/message/markAsViewed',
        onComplete: ->
          chat1.restart()
      }).get({
        token: chat1.token,
        _ids: data.message._id
      })




    messages1 = []
    chat1.bind 'messages', (data)->
      messages1 = data.messages;




    setTimeout(->
      console.log(messages1)
    , 2000)

).get()

