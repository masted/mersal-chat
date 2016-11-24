module.exports = function(server) {



  server.app.get('/api/v1/chat/getIdByFromToUsers', function(req, res) {
    server.db.collection('chat').findOne({
      name: server.chatName(req.fromUserId, req.toUserId)
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
    if (req.query.fromUserId == req.query.toUserId) {
      res.status(404).send({error: 'cat not create chat to yourself'});
      return;
    }
    var name = server.chatName(req.query.fromUserId, req.query.toUserId);

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
        // chat users
        server.db.collection('chatUsers').insertMany([
          {
            userId: req.query.fromUserId,
            chatId: server.db.ObjectID(chat._id).toString()
          },
          {
            userId: req.query.toUserId,
            chatId: server.db.ObjectID(chat._id).toString()
          }
        ]);
      } else {
        res.json({chatId: chat._id});
      }
    });
  });
};