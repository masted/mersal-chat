module.exports = function (server) {
  var socketioJwt = require('socketio-jwt');
  var SocketMessageActions = require('../../actions/SocketMessageActions');
  var ChatActions = require('../../actions/ChatActions');
  var MessageActions = require('../../actions/MessageActions');
  var SocketChatEventEmitter = require('../../SocketChatEventEmitter');

  // some init
  new SocketMessageActions(server);

  /**
   * @api {ws} /socket.io Overview
   * @apiGroup Socket
   *
   * @apiDescription
   *
   * WebSocket API allows you to receive events from Chat Server in real time and send messages.
   *
   * ## Basics
   *
   * To begin a WebSocket session use native Socket.IO client for your platform.
   * Once you have connected to the message server it will provide a stream of events.
   *`
   * If you connect successfully the first event received will be a "authenticated":
   *
   *     {type: 'authenticated'}
   *
   * All events in Socket.IO client receives on 'event' event with a one param `data` with all data.
   *
   * See the JS example:
   *
   *     client.on('event', function(data) {
   *       console.log('Event: ' + data.type);
   *     });
   *
   * All commands in Socket.IO client sends as Object with params from that API.
   * Commands marked as "emit" type. See the JS example:
   *
   *     client.emit('eventName', {someParam: 'asd'})
   *
   * ## Events:
   *
   *  User has joined the chat:
   *
   * `{type: 'joined'}`
   *
   *  New message has appears in chat:
   *
   * `{type: 'newMessage', {message: {...}}`
   *
   * New messages outside of any chat has come to user
   *
   * `{type: 'newUserMessages', {messages: [...]}`
   *
   *
   * ## Emits:
   *
   * `client.emit('join', {chatId: chatId})`
   *
   * - __chatId__ {Integer} Chat ID
   *
   *
   * `client.emit('markAsDelivered', {messageIds: messageIds})`
   *
   * - <b>messageIds</b> {String} Message IDs separated by quote
   * </p>
   */
  server.io.sockets.on('connection', socketioJwt.authorize({
    secret: server.config.jwtSecret,
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function (socket) {
    var messageActions = new MessageActions(server.db);
    var userId = socket.decoded_token._id;
    var _userId = server.db.ObjectID(userId);
    socket.userId = userId;

    console.log('authenticated userId=' + userId);
    // update status
    server.db.collection('users').update({_id: server.db.ObjectID(userId)}, {
      $set: {
        status: 'online',
        lastOnline: new Date()
      }
    }, function (/*err, result*/) {
      socket.emit('event', {type: 'authenticated'});

      // getting unseen messages for user
      messageActions.getUnseen(userId, function (messages) {
        if (messages.length == 0) return;
        socket.emit('event', {
          type: 'newUserMessages',
          messages: messages
        });
      });

      socket.on('join', function (data) {
        if (!data.chatId) {
          socket.emit('event', {
            type: 'joinError',
            error: 'chaId not presents in data: ' + JSON.stringify(data)
          });
          return;
        }
        console.log('joining chat ' + data.chatId);
        new ChatActions(server.db).canJoin(userId, data.chatId, function (success, error) {
          if (success === false) {
            socket.emit('event', {
              type: 'joinError',
              error: error
            });
          } else {
            socket.chatId = data.chatId;
            socket.join(data.chatId);
            socket.emit('event', {
              type: 'joined',
              chatId: data.chatId
            });
          }
        });
      });

      var ucFirst = function (str) {
        var f = str.charAt(0).toUpperCase();
        return f + str.substr(1, str.length - 1);
      };

      var markAs = function (keyword, data) {
        var context = 'markAs' + ucFirst(keyword);
        if (!data.chatId) {
          socket.emit('event', {
            type: 'error',
            context: context,
            error: 'chatId param is required'
          });
          return;
        }
        var messageIds = data.messageIds.trim();
        if (!messageIds) {
          socket.emit('event', {
            type: 'error',
            context: context,
            error: 'Empty messageIds param'
          });
          return;
        }
        messageIds = messageIds.split(',');
        for (var i = 0; i < messageIds.length; i++) {
          messageIds[i] = server.db.ObjectID(messageIds[i]);
        }
        var set = {};
        set[keyword] = true;

        server.db.collection('messages').find({
          _id: {
            $in: messageIds
          }
        }).toArray(function (err, messages) {
          for (var i = 0; i < messages.length; i++) {
            if (messages[i].userId.toString() == userId) {
              socket.emit('event', {
                type: 'error',
                context: context,
                error: 'it not allowed to mark as ' + keyword + ' your ouw message'
              });
              return;
            }
          }
          // MARK!
          server.db.collection('messages').updateMany({
            _id: {
              $in: messageIds
            }
          }, {
            $set: set
          }, function (err, r) {
            new SocketChatEventEmitter(server, data.chatId).emit(keyword, {
              messageIds: messageIds
            });
          });
        });
      };

      socket.on('markAsViewed', function (data) {
        markAs('viewed', data);
      });

      socket.on('markAsDelivered', function (data) {
        markAs('delivered', data);
      });

      socket.on('disconnect', function () {
        console.log('disconnect');
        server.db.collection('users').update({_id: server.db.ObjectID(socket.decoded_token._id)}, {
          $set: {
            status: 'offline',
            lastOnline: new Date()
          }
        });
        // при смене статуса
      });
    });
  });

};
