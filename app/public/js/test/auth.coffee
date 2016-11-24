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
    chat1.bind 'joined', ->
      chat1.sendMessage 'TEST'

    chat1.start()

    chat2 = new Chat(user2, '57e9120d8e2016833717515f')
    chat2.start()

    newMessages2 = []
    chat2.bind 'newMessage', (data)->
      newMessages2.push(data)
      setTimeout(->
        chat2.restart()
      , 50)

    # test 2
    newMessages = []
    chat1.bind 'newMessage', (data)->
      newMessages.push(data)

    messages1 = []
    chat1.bind 'messages', (data)->
      messages1 = data.messages;

    messages2 = []
    chat2.bind 'messages', (data)->
      messages2 = data.messages;

    setTimeout(->
      if newMessages.length != 1
        throw new Error('test 1 filed')
      if newMessages[0].message.userId != '57e9120d8e2016833717515f'
        throw new Error('test 2 filed')
      if newMessages2.length != 1
        throw new Error('test 3 filed')
      if messages2[0].userId != '57e9120d8e2016833717515f'
        throw new Error('test 4 filed')
      if messages2[0].viewed != false
        throw new Error('test 5 filed')

      _id = messages2[0]._id

      messages1 = []
      new Request({
        url: '/api/v1/message/markAsViewed', # only for user1
        onComplete: ->
          chat1.restart()
          setTimeout(->
            if messages1.length != 0
              throw new Error('test 6 filed')
            if messages2.length != 1
              throw new Error('test 7 filed')
          , 1000)
      }).get({
        token: chat1.token,
        _ids: _id
      })

    , 1000)

).get()

