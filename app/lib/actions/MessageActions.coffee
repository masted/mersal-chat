class MessageActions

  constructor: (@db) ->

  saveViewed: (messages, ownUserId, viewed, onComplete) ->
    if !ownUserId
      throw new Error('ownUserId not defined');
    if !onComplete
      onComplete = ->
    total = messages.length
    ownUserId = @db.ObjectID(ownUserId)
    _save = ((message, callback) ->
      @db.collection('mViewed').updateOne({
        messageId: message._id,
        chatId: message.chatId,
        ownUserId: ownUserId,
        viewed: viewed
      }, {
        messageId: message._id,
        chatId: message.chatId,
        ownUserId: ownUserId,
        viewed: viewed
      }, {
        upsert: true
      }, (err, r) ->
        console.log 'save mViewed ' + viewed + '; msgId=' + message._id
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

  setViewed: (messageIds, ownUserId, viewed, onComplete) ->
    messageIds = messageIds.map(((id) ->
      return @db.ObjectID(id)
    ).bind(@))
    @db.collection('messages').find({
      _id: {
        $in: messageIds
      }
    }).toArray(((err, messages) ->
      @saveViewed(messages, ownUserId, viewed, onComplete)
    ).bind(@))

  send: (userId, chatId, message, onComplete) ->
    chatId = @db.ObjectID(chatId)
    userId = @db.ObjectID(userId)
    message = {
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
          @setViewed([message._id], record.userId, record.userId.toString() == userId.toString(), ->
            n--
            if n == 0
              onComplete(message)
          )
      ).bind(@))
    ).bind(@))

  getUnseen: (ownUserId, chatId, onComplete) ->
    console.log ownUserId + ' ---- ' + chatId
    @db.collection('mViewed').find({
      ownUserId: @db.ObjectID(ownUserId),
      chatId: @db.ObjectID(chatId),
      #viewed: false
    }, {
      messageId: 1
    }).toArray(((err, items) ->
      if !items.length
        console.log 'no unseen'
        onComplete([])
        return
      messageIds = items.map (item) -> item.messageId
      console.log 'get unseen by ' + messageIds
      @db.collection('messages').find({
        _id: {
          $in: messageIds
        }
      }).toArray((err, messages) ->
        onComplete(messages)
      )
    ).bind(@))

  addViewedStatus: (messages, onComplete) ->
    messageIds = messages.map((message) ->
      return message._id
    )
    @db.collection('mViewed').find({
      messageId: {
        $in: messageIds
      }
    }, {
      viewed: 1,
      ownUserId: 1
    }).toArray((err, statuses) ->

    )

  getViewStatuses: (messageId, onComplete) ->
    @db.collection('mViewed').find({
      messageId: messageId
    }).toArray((err, statuses) ->
      console.log '################'
      console.log statuses
      onComplete(statuses)
    )

module.exports = MessageActions