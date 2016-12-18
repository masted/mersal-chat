module.exports = function(server) {
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
  })).on('authenticated', function(socket) {
    var messageActions = new MessageActions(server.db);
    var userId = socket.decoded_token._id;
    socket.userId = userId;
    console.log('authenticated userId=' + userId);
    // update status
    server.db.collection('users').update({_id: server.db.ObjectID(userId)}, {
      $set: {
        status: 'online'
      }
    }, function(/*err, result*/) {
      socket.emit('event', {type: 'authenticated'});

      // getting unseen messages for user
      messageActions.getUnseen(userId, function(messages) {
        if (messages.length == 0) return;
        socket.emit('event', {
          type: 'newUserMessages',
          messages: messages
        });
      });

      socket.on('join', function(data) {
        if (!data.chatId) {
          socket.emit('event', {
            type: 'joinError',
            error: 'chaId not presents in data: ' + JSON.stringify(data)
          });
          return;
        }
        console.log('joining chat ' + data.chatId);
        new ChatActions(server.db).canJoin(userId, data.chatId, function(success, error) {
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

      socket.on('markAsViewed', function(data) {
        messageActions.setStatuses(data.messageIds.split(','), userId, true);
      });

      socket.on('markAsDelivered', function(data) {
        if (!data.chatId) {
          socket.emit('event', {
            type: 'error',
            context: 'markAsDelivered',
            error: 'chatId param is required'
          });
          return;
        }
        var messageIds = data.messageIds.trim();
        if (!messageIds) {
          socket.emit('event', {
            type: 'error',
            context: 'markAsDelivered',
            error: 'Empty messageIds param'
          });
          return;
        }
        messageIds = messageIds.split(',');
        for (var i = 0; i < messageIds.length; i++) {
          messageIds[i] = server.db.ObjectID(messageIds[i]);
        }
        console.log(['mark as delivered', messageIds]);
        server.db.collection('messages').updateMany({
          _id: {
            $in: messageIds
          }
        }, {
          $set: {
            delivered: true
          }
        }, function(err, r) {
          setTimeout(function() {
            new SocketChatEventEmitter(server, data.chatId).emit('delivered', {
              messageIds: messageIds
            });
          }, 1000);
        });
      });

      socket.on('disconnect', function() {
        console.log('disconnect');
        server.db.collection('users').update({_id: server.db.ObjectID(socket.decoded_token._id)}, {
          $set: {
            status: 'offline'
          }
        });
        // при смене статуса
      });
    });
  });

};
