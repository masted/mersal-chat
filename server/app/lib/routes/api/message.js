module.exports = function(server) {
  var MessageActions = require('../../actions/MessageActions');
  var ChatActions = require('../../actions/ChatActions');

  /**
   * @api {get} /message/send Send a message in chat
   * @apiName SendMessage
   * @apiGroup Message
   *
   * @apiParam {String} token JWT token
   * @apiParam {Number} chatId Chat ID
   * @apiParam {String} message Message text
   *
   * @apiSuccess {String} json
   *
   * @apiSuccessExample Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *     "success": 1
   *   }
   */
  server.app.get('/api/v1/message/send', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      if (!req.query.chatId) {
        res.status(404).send({error: 'chatId not defined'})
        return;
      }
      if (!req.query.message) {
        res.status(404).send({error: 'message not defined'})
        return;
      }
      new MessageActions(server.db).send(user._id, req.query.chatId, req.query.message, function(message) {
        server.event.emit('newMessage', message);
        res.json(message);
      });
    });
  });

  /**
   * @api {get} /message/userSend Send a message to user
   * @apiName SendUserMessage
   * @apiGroup Message
   *
   * @apiParam {String} token JWT token
   * @apiParam {Number} userId User ID
   * @apiParam {Number} chatId Chat ID
   * @apiParam {String} message Message text
   *
   * @apiSuccess {String} json
   *
   * @apiSuccessExample Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *     "success": 1
   *   }
   */
  server.app.get('/api/v1/message/userSend', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      if (!req.query.userId) {
        res.status(404).send({error: 'userId not defined'});
        return;
      }
      if (!req.query.chatId) {
        res.status(404).send({error: 'chatId not defined'});
        return;
      }
      if (!req.query.message) {
        res.status(404).send({error: 'message not defined'});
        return;
      }
      (new ChatActions(server.db)).canJoin(user._id, req.query.chatId, function(canJoin) {
        if (!canJoin) {
          res.status(404).send({error: 'user has no access to that chat'});
        } else {
          new MessageActions(server.db).userSend(user._id, req.query.userId, req.query.chatId, req.query.message, function(message) {
            server.event.emit('newUserMessage', message);
            res.json(message);
          }, function(error) {
            res.status(404).json({error: error});
          });
        }
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
        res.json({success: 1});
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
   * @apiParam {Integer} n Number of messages per page (default: 20)
   * @apiParam {Integer} pageN Page number starting from 1 (default: 1)
   */
  server.app.get('/api/v1/message/list', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      if (!req.query.chatId) {
        res.status(404).send({error: 'chatId not defined'});
        return;
      }
      var n = req.query.n || 20;
      var pageN = req.query.pageN || 1;
      server.db.collection('messages').find({
        chatId: server.db.ObjectID(req.query.chatId)
      }). //
      sort({ //
        createTime: -1
      }).
      skip(n * (pageN - 1)).limit(n). //
      toArray(function(err, messages) {
        res.json(messages);
      });
    });
  });

  server.app.get('/api/v1/message/getUnseen', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      if (!req.query.chatId) {
        res.status(404).send({error: 'chatId not defined'});
        return;
      }
      (new ChatActions(server.db)).canJoin(user._id, req.query.chatId, function(canJoin) {
        if (!canJoin) {
          res.status(404).send({error: 'user has no access to that chat'});
        } else {
          server.db.collection('messages').find({
            chatId: server.db.ObjectID(req.query.chatId),
            viewed: false
          }).sort({
            $natural: -1
          }).toArray(function(err, messages) {
            res.json(messages);
          });
        }
      });
    });
  });

  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 20; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

  /**
   * @api {post} /message/upload Upload file
   * @apiName Upload photo/video
   * @apiDescription <a href="http://chat.311.su:8080/test/upload/message.html">Web example</a>
   * @apiGroup Message
   *
   * @apiParam {String} token JWT token
   * @apiParam {File} file File (File via multipart/form-data)
   *
   * @apiSuccess {String} filename File accessible by url HOST/uploads/message/{userId}/{filename}. {userId} - ID of User sends message
   */
  var formidable = require('formidable');
  var fs = require('fs');
  server.app.post('/api/v1/message/upload', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      var fileName = makeid();
      var form = new formidable.IncomingForm();
      form.uploadDir = server.path.join(server.config.appFolder, '/public/uploads/message/' + user._id);
      if (!fs.existsSync(form.uploadDir)) {
        fs.mkdirSync(form.uploadDir);
      }
      form.on('file', function(field, file) {
        console.log('new file: ' + server.path.join(form.uploadDir, fileName));
        fs.rename(file.path, server.path.join(form.uploadDir, fileName));
      });
      form.on('error', function(err) {
        console.log('An error has occured: \n' + err);
      });
      form.on('end', function() {
        res.end(fileName);
      });
      form.parse(req);
    });
  });

};