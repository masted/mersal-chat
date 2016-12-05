module.exports = function(server) {
  var socketioJwt = require('socketio-jwt');
  var SocketMessageActions = require('../../actions/SocketMessageActions');
  var ChatActions = require('../../actions/ChatActions');
  var MessageActions = require('../../actions/MessageActions');

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
   *
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
   *  New message has come:
   *
   * `{type: 'newMessage', {message: {...}}`
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
      socket.on('join', function(data) {
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
              type: 'joined'
            });
            // new MessageActions(server.db).getUndelivered(userId, data.chatId, function(messages) {
            //   server.io.in(data.chatId).emit('event', {
            //     type: 'messages',
            //     messages: messages
            //   });
            // });
          }
        });
      });

      socket.on('markAsViewed', function(messageIds) {
        new MessageActions(server.db).setStatuses(messageIds.split(','), userId, true);
      });

      socket.on('markAsDelivered', function(messageIds) {
        messageIds = messageIds.split(',');
        server.db.collection('messages').update({
          $in: {
            _id: messageIds
          }
        }, {
          delivered: true
        }, function(err, r) {
          socket.emit('event', {
            type: 'delivered',
            messageIds: messageIds
          });
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
