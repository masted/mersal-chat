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
      console.log('1111111');
      new MessageActions(server.db).send(user._id, req.query.chatId, req.query.message, function(message) {
        console.log('222222222');
        server.event.emit('newMessage', message);
        res.send('success');
      });
    });
  });

  /**
   * @api {get} /api/v1/message/markAsViewed Mark as viewed
   * @apiName MarkAsViewed
   * @apiGroup Message
   *
   * @apiParam {String} token JWT token
   * @apiParam {String} _ids Object IDs separeted by quote ",". ID is the "_id" param of Mongo Document
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

};