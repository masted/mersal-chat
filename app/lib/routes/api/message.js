module.exports = function(server) {

  var saveViewed = function(messages, ownUserId, viewed, onComplete) {
    if (!ownUserId) throw new Error('ownUserId not defined');
    if (!onComplete) onComplete = function() {
    };
    var total = messages.length, result = [];
    var _save = function(doc, callback) {
      server.db.collection('mViewed').updateOne({
        messageId: doc._id,
        chatId: doc.chatId,
        ownUserId: ownUserId,
        viewed: viewed
      }, {
        messageId: doc._id,
        chatId: doc.chatId,
        ownUserId: ownUserId,
        viewed: viewed
      }, {
        upsert: true
      }, function(err, r) {
        console.log('save mViewed ' + viewed + '; msgId=' + doc._id);
        callback();
      });
    };
    var saveAll = function() {
      var doc = messages.pop();
      _save(doc, function() {
        if (--total) {
          saveAll();
        } else {
          onComplete();
        }
      });
    };
    saveAll();
  };

  var setViewed = function(server, ids, ownUserId, viewed, onComplete) {
    server.db.collection('messages').find({
      _id: {
        $in: ids
      }
    }).toArray(function(err, messages) {
      saveViewed(messages, ownUserId, viewed, onComplete);
    });
  };

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
      var message = {
        userId: user._id,
        chatId: req.query.chatId,
        message: req.query.message
      };
      server.db.collection('messages').insertOne(message, function(err, r) {
        server.io.in(req.query.chatId).emit('event', {
          type: 'newMessage',
          message: message
        });
      });

      server.db.collection('chatUsers').find({
        chatId: req.query.chatId
      }, {
        userId: 1
      }).toArray(function(err, userIds) {

        for (var i = 0; i < userIds.length; i++) {

          setViewed(server, [message._id], userIds[i].userId, userIds[i].userId == user._id);
        }
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
      var ids = req.query._ids.split(',');
      ids = ids.map(function(id) {
        return server.db.ObjectID.createFromHexString(id)
      });
      setViewed(server, ids, user._id, true, function(n) {
        res.send('success');
      });
    });
  });

};