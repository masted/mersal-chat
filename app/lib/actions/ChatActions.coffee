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
        @db.collection('mViewed').remove({
          #chatId: chat._id
        }, (err, r) ->
          console.log 'cleanup chat id ' + chat._id + ' mViewed. deleted: ' + r.result.n
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

  getOrCreateByTwoUser: (fromUserId, toUserId, onComplete) ->
    name = @chatNameTwoUsers(fromUserId, toUserId);
    @db.collection('chat').findOne({
      name: name
    }, ((err, chat) ->
      if (chat == null)
        chat = {name: name}
        @db.collection('chat').insertOne chat, ((err, r) ->
          console.log 'chat created ' + chat._id + ', inserting users'
          @db.collection('chatUsers').insertMany([
            {
              userId: @db.ObjectID(fromUserId),
              chatId: chat._id
            },
            {
              userId: @db.ObjectID(toUserId),
              chatId: chat._id
            }
          ], (err, r) ->
            onComplete chat._id
          )
        ).bind(@)
      else
        console.log 'chat exists ' + chat._id
        onComplete chat._id
      ).bind(@)
    )

module.exports = ChatActions