module.exports = function(server) {
  var ChatActions = require('../../actions/ChatActions');

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

  /**
   * @api {get} /getOrCreateByTwoUser Get or create
   * @apiDescription Get chat ID by two user IDs or creates it
   * @apiGroup Chat
   *
   * @apiParam {Integer} fromUserId User ID 1
   * @apiParam {Integer} toUserId User ID 2
   *
   * @apiSuccess {String} json JSON with chat ID
   *
   * @apiSuccessExample Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *     "chatId": "..."
   *   }
   */
  server.app.get('/api/v1/chat/getOrCreateByTwoUser', function(req, res) {
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
    new ChatActions(server.db).getOrCreateByTwoUser(req.query.fromUserId, req.query.toUserId, function(chatId) {
      res.json({chatId: chatId});
    });
  });
};