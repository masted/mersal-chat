module.exports = function(server) {

  server.app.get('/dev/cleanupChat/:fromUserId/:toUserId', function(req, res) {
    var chatName = server.chatName(req.params.fromUserId, req.params.toUserId);
    server.db.collection('chat').findOne({
      name: chatName
    }, function(err, chat) {
      if (!chat) {
        console.log('no chat. nothing to cleanup');
        res.send('done');
        return;
      }
      server.db.collection('messages').remove({
        chatId: '' + chat._id
      }, function(err, r) {
        console.log('cleanup chat id ' + chat._id + ' messages. deleted: ' + r.result.n);
        server.db.collection('mViewed').remove({
          chatId: '' + chat._id
        }, function(err, r) {
          console.log('cleanup chat id ' + chat._id + ' mViewed. deleted: ' + r.result.n);
          res.send('done');
        });
      });
    })

  });

};