class UserMessage
  constructor: (@db, @userId) ->
  send: ()
  getUnseen: (chatId, callback) ->
    @db.collection('mViewed').find({
      ownUserId: '' + @userId,
      chatId: '' + data.chatId,
      viewed: false
    }, {
      messageId: 1
    }).toArray((err, messageIds) ->
      console.log messageIds
#      @db.collection('messages').find({
#        chatId: '' + data.chatId
#      }).toArray(function(err, messages) {
#        if (messages.length === 0) {
#          console.log('NOTHING FOUND');
#          return;
#      }
#      server.io.in(data.chatId).emit('event', {
#        type: 'messages',
#        messages: messages
#      });
#      });
    )




