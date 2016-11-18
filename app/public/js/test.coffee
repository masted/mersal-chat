user1 =
  login: 'Anton' # 57e9120d8e2016833717515f
  password: '888'
  device: 'android'

user2 =
  login: '123123' # 580b4d3d2aa614094c58cff5
  password: 'null'
  device: 'android'

chat1 = new Chat(user1, '57e9120d8e2016833717515f');
chat2 = new Chat(user2, '580b4d3d2aa614094c58cff5');
chat1.bind 'joined', ->
  chat1.sendMessage 'TEST'
chat1.start()

#setTimeout(->
#  if chat1.messages[chat1.messages.length - 1] != 'test'
#    throw new Error('test filed')
#, 1000)
