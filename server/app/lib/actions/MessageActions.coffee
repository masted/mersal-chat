class MessageActions

  constructor: (@db) ->

  saveStatuses: (messages, ownUserId, viewed, onComplete) ->
    if !ownUserId
      throw new Error('ownUserId not defined');
    if !onComplete
      onComplete = ->
    total = messages.length
    ownUserId = @db.ObjectID(ownUserId)
    _save = ((message, callback) ->
      @db.collection('messageStatuses').updateOne({
        messageId: message._id,
        chatId: message.chatId,
        ownUserId: ownUserId
      }, {
        messageId: message._id,
        chatId: message.chatId,
        ownUserId: ownUserId,
        viewed: viewed,
        delivered: false
      }, {
        upsert: true
      }, (err, r) ->
        console.log 'save messageStatuses ' + viewed + '; msgId=' + message._id
        callback()
      )
    ).bind(@)
    saveAll = ->
      message = messages.pop()
      _save(message, ->
        if --total
          saveAll()
        else
          onComplete()
      )
    saveAll()

  setStatuses: (messageIds, ownUserId, viewed, onComplete) ->
    messageIds = messageIds.map(((id) ->
      return @db.ObjectID(id)
    ).bind(@))
    @db.collection('messages').find({
      _id: {
        $in: messageIds
      }
    }).toArray(((err, messages) ->
      @saveStatuses(messages, ownUserId, viewed, onComplete)
    ).bind(@))

  send: (userId, chatId, message, onComplete) ->
    chatId = @db.ObjectID(chatId)
    userId = @db.ObjectID(userId)
    message = {
      createTime: new Date().getTime(),
      userId: userId,
      chatId: chatId,
      message: message
    }
    @db.collection('messages').insertOne(message, ((err, r) ->
      @db.collection('chatUsers').find({
        chatId: chatId
      }, {
        userId: 1
      }).toArray(((err, records) ->
        console.log 'adding messages for ' + records.length + ' users'
        n = records.length
        for record in records
          @setStatuses([message._id], record.userId, record.userId.toString() == userId.toString(), ->
            n--
            if n == 0
              onComplete(message)
          )
      ).bind(@))
    ).bind(@))

  userSend: (userId, toUserId, chatId, message, onComplete) ->
    userId = @db.ObjectID(userId)
    toUserId = @db.ObjectID(toUserId)
    chatId = @db.ObjectID(chatId)
    message =
      createTime: new Date().getTime(),
      userId: userId,
      toUserId: toUserId,
      chatId: chatId,
      message: message
    @db.collection('messages').insertOne(message, ((err, r) ->
      @saveStatuses([message], userId, true, (-> # sender viewed
        @saveStatuses([message], toUserId, false, (-> # recipient not yet
          @db.collection('chatUsers').updateOne({
            chatId: message.chatId,
            userId: toUserId
          }, {
            chatId: message.chatId,
            userId: toUserId
          }, {
            upsert: true
          }, ->
            console.log 'add user ' + toUserId + ' to ' + chatId
            onComplete(message)
          )
        ).bind(@))
      ).bind(@))
    ).bind(@))

  getUnseen: (ownUserId, onComplete) ->
    @db.collection('messageStatuses').find({
      ownUserId: @db.ObjectID(ownUserId),
      viewed: false
    }, {
      messageId: 1
    }).toArray(((err, items) ->
      if !items.length
        console.log 'no unseen'
        onComplete([])
        return
      messageIds = items.map (item) -> item.messageId
      @db.collection('messages').find({
        _id: {
          $in: messageIds
        }
      }).toArray((err, messages) ->
        onComplete(messages)
      )
    ).bind(@))

  getStatuses: (messageId, onComplete) ->
    @db.collection('messageStatuses').find({
      messageId: messageId
    }).toArray((err, statuses) ->
      onComplete(statuses)
    )

  # get messages for all users that must receive it
  getUserMessages: (message, onComplete) ->
    @getStatuses(message._id, (statuses) ->
      userMessages = {}
      for status in statuses
        userMessage = Object.assign({}, message)
        userMessage._id = status._id
        userMessage.ownUserId = status.ownUserId
        userMessage.viewed = status.viewed
        userMessage.delivered = status.delivered
        userMessages[status.ownUserId] = userMessage
      onComplete(userMessages)
    )

module.exports = MessageActions