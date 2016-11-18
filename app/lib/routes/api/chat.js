module.exports = function(server) {

  var chatName = function(fromUserId, toUserId) {
    return 'chat-' + fromUserId + '-' + toUserId;
  };

  server.app.get('/api/v1/chat/getIdByFromToUsers', function(req, res) {
    server.db.collection('chat').findOne({
      name: chatName(req.fromUserId, req.toUserId)
    }, function(err, r) {
      if (r === null) {
        res.send('none');
      } else {
        res.send(r._id);
      }
    });
  });

  server.app.get('/api/v1/chat/list', function(req, res) {
    server.db.collection('chat').find().toArray(function(err, chats) {
      res.json(chats);
    });
  });

  server.app.get('/api/v1/chat/getOrCreateIdByFromToUsers', function(req, res) {
    if (!req.query.fromUserId) {
      res.status(404).send({error: 'fromUserId not defined'});
      return;
    }
    if (!req.query.toUserId) {
      res.status(404).send({error: 'toUserId not defined'});
      return;
    }
    var name = chatName(req.query.fromUserId, req.query.toUserId);
    server.db.collection('chat').findOne({
      name: name
    }, function(err, chat) {
      if (chat === null) {
        chat = {
          name: name
        };
        server.db.collection('chat').insertOne(chat, function(err, r) {
          console.log('chat created ' + chat._id);
          res.json({chatId: chat._id});
        });
      } else {
        res.json({chatId: chat._id});
      }
    });
  });
};