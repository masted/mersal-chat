module.exports = function(server) {

  /**
   * @api {get} /message/send/:chatId/:message Send a message
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
      server.db.collection('messages').insertOne({
        userId: user._id,
        chatId: req.query.chatId,
        message: req.query.message,
        viewed: false
      });
      io.in('events' + req.query.toUser).emit('newMessage', {
        fromUser: req.query.fromUser
      });
      res.send('success');
    });
  });

  // /**
  //  * @api {get} /message/getNew/:fromUser/:toUser Getting new messages from chat (FOR DEBUG ONLY)
  //  * @apiName GetNew
  //  * @apiGroup Message
  //  *
  //  * @apiParam {Number} fromUser Sender user ID
  //  * @apiParam {Number} toUser Recipient user ID
  //  *
  //  * @apiSuccess {json} New messages
  //  */
  // server.app.get('/api/v1/message/getNew', function(req, res) {
  //   //
  //   var result = {};
  //   db.collection('messages').find({
  //     fromUser: req.query.fromUser,
  //     toUser: req.query.toUser,
  //     viewed: false
  //   }, {
  //     //_id: 0
  //   }).toArray(function(err, r) {
  //     assert.equal(null, err);
  //     result.messages = r;
  //     //
  //     result.users = {};
  //     db.collection('users').findOne({
  //       id: parseInt(req.query.fromUser)
  //     }, {
  //       _id: 0
  //     }, function(err, r) {
  //       result.users.from = r;
  //       db.collection('users').findOne({
  //         id: parseInt(req.query.toUser)
  //       }, {
  //         _id: 0
  //       }, function(err, r) {
  //         result.users.to = r;
  //         // -----
  //         res.send(result);
  //       });
  //     });
  //   });
  // });
  //
  // /**
  //  * @api {get} /message/markAsViewed/:_ids Mark as viewed
  //  * @apiName MarkAsViewed
  //  * @apiGroup Message
  //  *
  //  * @apiParam {String} token JWT token
  //  * @apiParam {String} _ids Object IDs separeted by quote ",". ID is the "_id" param of Mongo Document
  //  */
  // server.app.get('/api/v1/message/markAsViewed', function(req, res) {
  //   tokenReq(req, res, function(res, user) {
  //     var ids = req.query._ids.split(',');
  //     db.collection('messages').updateMany({
  //       _id: new db.ObjectID.createFromHexString('57ea54fd8a2fef5fea82041f')
  //     }, {
  //       $set: {
  //         viewed: true
  //       }
  //     }, function(err, r) {
  //       console.log(r.result);
  //       res.send(r.result.n ? 'success' : 'failed');
  //     });
  //   });
  // });

};