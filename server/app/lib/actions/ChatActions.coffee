class ChatActions
  constructor: (@db) ->

  djb2Code: (str) ->
    hash = 5381
    i = 0
    while i < str.length
      char = str.charCodeAt(i)
      hash = (hash << 5) + hash + char
      i++
    hash
    
  cleanup: (fromUserId, toUserId, onComplete) ->
    chatName = @chatNameTwoUsers(fromUserId, toUserId);
    @db.collection('chat').findOne({
      name: chatName
    }, ((err, chat) ->
      if !chat
        console.log 'no chat. nothing to cleanup'
        onComplete()
        return
      @db.collection('messages').remove({
        #chatId: chat._id
      }, ((err, r) ->
        console.log 'cleanup chat id ' + chat._id + ' messages. deleted: ' + r.result.n
        @db.collection('messageStatuses').remove({
          #chatId: chat._id
        }, (err, r) ->
          console.log 'cleanup chat id ' + chat._id + ' messageStatuses. deleted: ' + r.result.n
          onComplete()
        )
      ).bind(@))
    ).bind(@))
    
  chatNameTwoUsers: (fromUserId, toUserId) ->
    if @djb2Code(fromUserId) < @djb2Code(toUserId)
      userId1 = fromUserId
      userId2 = toUserId
    else
      userId1 = toUserId
      userId2 = fromUserId
    return 'chat-' + userId1 + '-' + userId2

  getOrCreateByTwoUsers: (fromUserId, toUserId, onComplete) ->
    name = @chatNameTwoUsers(fromUserId, toUserId);
    fromUserId = @db.ObjectID(fromUserId)
    toUserId = @db.ObjectID(toUserId)
    @db.collection('chat').findOne({
      name: name
    }, ((err, chat) ->
      if (chat == null)
        chat = {name: name}
        @db.collection('chat').insertOne chat, ((err, r) ->
          console.log 'chat created ' + chat._id + ', inserting users'
          @db.collection('chatUsers').insertMany([
            {
              userId: fromUserId,
              chatId: chat._id
            },
            {
              userId: toUserId,
              chatId: chat._id
            }
          ], (err, r) ->
            @extendByUsers([fromUserId, toUserId], chat, onComplete)
          )
        ).bind(@)
      else
        @extendByUsers([fromUserId, toUserId], chat, onComplete)
      ).bind(@)
    )

  extendByUsers: (userIds, chat, onComplete) ->
    @db.collection('users').find({
      _id: {
        $in: userIds
      }
    }, {
      _id: 1,
      login: 1,
      phone: 1
    }).toArray((err, _users) ->
      console.log 'chat exists ' + chat._id
      users = {}
      for user in _users
        users[user._id] = user
      onComplete(
        users: users
        chatId: chat._id
      )
    )

  canJoin: (userId, chatId, callback) ->
    userId = @db.ObjectID(userId)
    chatId = @db.ObjectID(chatId)
    @db.collection('chat').findOne({
      _id: chatId
    }, ((err, r) ->
      if r == null
        callback(false, 'chat ' + chatId + 'does not exists')
      else
        @db.collection('chatUsers').findOne({
          chatId: chatId,
          userId: userId
        }, (err, r) ->
          if r == null
            callback(false, 'user not in chat')
          else
            callback(true)
        )
    ).bind(@))


module.exports = ChatActions