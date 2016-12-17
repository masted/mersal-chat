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
   * @api {get} /chat/getOrCreateByTwoUsers Get or create
   * @apiDescription Get chat ID by two user IDs or creates it
   * @apiGroup Chat
   *
   * @apiParam {String} token JWT token
   * @apiParam {Integer} userId User ID 2
   *
   * @apiSuccess {String} json JSON with chat ID
   *
   * @apiSuccessExample Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *     "chatId": "..."
   *     "users": [users in chat]
   *   }
   */
  server.app.get('/api/v1/chat/getOrCreateByTwoUsers', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      var fromUserId = user._id
      if (!req.query.userId) {
        res.status(404).send({error: 'userId not defined'});
        return;
      }
      if (fromUserId == req.query.userId) {
        res.status(404).send({error: 'can not create chat to yourself'});
        return;
      }
      new ChatActions(server.db).getOrCreateByTwoUsers(fromUserId, req.query.userId, function(data) {
        res.json(data);
      });
    });
  });
};