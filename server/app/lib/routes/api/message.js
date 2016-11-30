module.exports = function(server) {
  var MessageActions = require('../../actions/MessageActions');

  /**
   * @api {get} /message/send Send a message
   * @apiName SendMessage
   * @apiGroup Message
   *
   * @apiParam {String} token JWT token
   * @apiParam {Number} chatId Chat ID
   * @apiParam {String} message Message text
   *
   * @apiSuccess {String} success The string "success" on success
   */
  server.app.get('/api/v1/message/send', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      new MessageActions(server.db).send(user._id, req.query.chatId, req.query.message, function(message) {
        server.event.emit('newMessage', message);
        res.send('success');
      });
    });
  });

  /**
   * @api {get} /message/markAsViewed Mark as viewed
   * @apiName MarkAsViewed
   * @apiGroup Message
   *
   * @apiParam {String} token JWT token
   * @apiParam {String} _ids Object IDs separated by quote ",". ID is the "_id" param of Mongo Document
   */
  server.app.get('/api/v1/message/markAsViewed', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      if (!req.query._ids) {
        res.status(404).send({error: '_ids not defined'})
        return;
      }
      new MessageActions(server.db).setStatuses(req.query._ids.split(','), user._id, true, function() {
        res.send('success');
      });
    });
  });

  /**
   * @api {get} /message/list Get messages list
   * @apiName List
   * @apiGroup Message
   *
   * @apiParam {String} token JWT token
   * @apiParam {String} chatId Chat ID
   */
  server.app.get('/api/v1/message/list', function(req, res) {
    server.fakeTokenReq(req, res, function(res, user) {
      if (!req.query.chatId) {
        res.status(404).send({error: 'chatId not defined'})
        return;
      }
      server.db.collection('messages').find({
        $query:  {
          chatId: server.db.ObjectID(req.query.chatId)
        },
        $orderby: {
          createTime: -1
        }
      }).toArray(function(err, messages) {
        res.json(messages);
      });
    });
  });

};