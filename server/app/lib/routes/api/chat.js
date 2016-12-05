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
   * @apiParam {Integer} fromUserId User ID 1
   * @apiParam {Integer} toUserId User ID 2
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
      if (server.db.ObjectID(req.query.fromUserId) != user._id) {
        res.status(404).send({error: 'user token is not belongs to fromUserId'});
        return;
      }
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
      new ChatActions(server.db).getOrCreateByTwoUsers(req.query.fromUserId, req.query.toUserId, function(data) {
        res.json(data);
      });
    });
  });
};