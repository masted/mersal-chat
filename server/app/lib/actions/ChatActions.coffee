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
          ], ((err, r) ->
            @extendByUsers([fromUserId, toUserId], chat, onComplete)
          ).bind(@))
        ).bind(@)
      else
        @extendByUsers([fromUserId, toUserId], chat, onComplete)
      ).bind(@)
    )

  get: (chatId, onComplete) ->
    chatId = @db.ObjectID(chatId)
    @db.collection('chat').findOne({
        _id: chatId
      }, ((err, chat) ->
        if (chat == null)
          onComplete(false)
        else
          @db.collection('chatUsers').find({
            chatId: chat._id
          }, {
            userId: 1
          }).toArray(((err, users) ->
            userIds = users.map((user) ->
              user.userId
            )
            @extendByUsers(userIds, chat, onComplete)
          ).bind(@))
      ).bind(@)
    )

  userPublicFields: {
    _id: 1,
    login: 1,
    phone: 1,
    status: 1,
    lastOnline: 1
  }

  extendByUsers: (userIds, chat, onComplete) ->
    @db.collection('users').find({
      _id: {
        $in: userIds
      }
    }, @userPublicFields).toArray((err, _users) ->
      users = {}
      for user in _users
        users[user._id] = user
      onComplete(
        users: Object.values(users)
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

  getByUser: (userId, callback) ->
    @db.collection('chatUsers').find({
      userId: @db.ObjectID(userId)
    }).toArray(((err, chats) ->
      _chats = {}
      chatIds = []
      for chat in chats
        _chats[chat.chatId] = {chatId: chat.chatId};
        chatIds.push(chat.chatId)
      # get last messages in every chat
      @db.collection('messages').aggregate([
        {
          $match: {
            chatId: {
              $in: chatIds
            }
          }
        },
        {
          $sort: {
            chatId: 1,
            createTime: -1
          }
        },
        {
          $group: {
            _id: "$chatId",
            createTime: { $first: "$createTime" },
            messageId: { $first: "$_id" },
            userId: { $first: "$userId" },
            toUserId: { $first: "$toUserId" },
            message: { $first: "$message"}
          }
        }
      ]).toArray(((err, messages) ->
        for message in messages
          chatId = message._id;
          _chats[message._id].message = message
          _chats[message._id].message.chatId = chatId
          delete _chats[message._id].message._id
        # add users
        @db.collection('chatUsers').find({
          chatId: {
            $in: chatIds
          }
        }).toArray(((err, chatUsers) ->

          userId2ChatId = {}
          for chatUser in chatUsers
            userId2ChatId[chatUser.userId] = chatUser.chatId

          userIds = []
          for chatUser in chatUsers
            userIds.push(chatUser.userId)

          @db.collection('users').find({
            _id: {
              $in: userIds
            }
          }, @userPublicFields).toArray((err, users) ->
            for user in users
              _chat = _chats[userId2ChatId[user._id]]
              if !_chat.users
                _chat.users = []
              _chat.users.push(user)
            callback(Object.values(_chats))
          )
        ).bind(@))
      ).bind(@))
    ).bind(@))

module.exports = ChatActions