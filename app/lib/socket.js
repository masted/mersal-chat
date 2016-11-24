module.exports = function(server) {
  var socketioJwt = require('socketio-jwt');
  //server.io.set('transports', ['websocket']);

  /**
   * @api {ws} /socket.io Connection
   * @apiGroup Socket
   *
   * @apiDescription WebSocket API allows you to receive events from Chat Server in real time and send messages.
   *                 <h2>Basics</h2>
   *                 <p>To begin a WebSocket session use native Socket.IO client for your platform.
   *                 Once you have connected to the message server it will provide a stream of events.</p>
   *                 <p>If you connect successfully the first event received will be a "authenticated":</p>
   *                 <code>
   *                   {type: 'authenticated'}
   *                 </code><br><br>
   *                 <p>All events in Socket.IO client receives on 'event' event with a data in JSON format.
   *                 See the JS example:</p>
   *                 <code>
   *                   client.on('event', function(data) {
   *                     console.log('Event: ' + data.type);
   *                   });
   *                 </code><br><br>
   *                 <p>All commands in Socket.IO client sends as JSON with params from that API.
   *                 Commands marked as "emit" type. See the JS example:</p>
   *                 <code>
   *                   client.emit('eventName', {someParam: 'asd'})
   *                 </code><br><br>
   */
  server.io.sockets.on('connection', socketioJwt.authorize({
    secret: server.config.jwtSecret,
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function(socket) {
    var userId = socket.decoded_token._id;
    console.log('authenticated userId=' + userId);
    // update status
    server.db.collection('users').update({_id: server.db.ObjectID(userId)}, {
      $set: {
        status: 'online'
      }
    }, function(/*err, result*/) {
      socket.emit('event', {type: 'authenticated'});

      /**
       * @api {emit} join Join a chat
       * @apiGroup Socket
       * @apiDescription Joins a chat
       * @apiExample {js} Example usage:
       *                  client.emit('join', {userId: 78888888888, chatId: '582ed9b585da7c238f4a1f4e'})
       *
       * @apiParam {String} userId User ID
       * @apiParam {String} chatId Chat ID
       */
      socket.on('join', function(data) {
        console.log('joining chat ' + data.chatId);
        server.db.collection('chat').findOne({
          _id: server.db.ObjectID(data.chatId)
        }, function(err, r) {
          if (r === null) {
            socket.emit('event', {
              type: 'joinError',
              error: 'chat does not exists'
            });
          } else {
            console.log('joined ' + data.chatId);
            socket.chatId = data.chatId;
            socket.join(data.chatId);

            socket.emit('event', {
              type: 'joined'
            });


            // ======================
            server.db.collection('mViewed').find({
              ownUserId: '' + userId,
              chatId: '' + data.chatId,
              viewed: false
            }, {
              messageId: 1
            }).toArray(function(err, messageIds) {
              console.log('-=----------------');
              console.log(messageIds);
            });

            //        sending new messages from db to client
            server.db.collection('messages').find({
              chatId: '' + data.chatId
            }).toArray(function(err, messages) {
              if (messages.length === 0) {
                console.log('NOTHING FOUND');
                return;
              }
              server.io.in(data.chatId).emit('event', {
                type: 'messages',
                messages: messages
              });
            });

            // ======================

          }
        });

      });

      /**
       * @api {emit} message Get new messages
       * @apiGroup Socket
       * @apiDescription Get a new messages from joined chat
       *
       * @apiParam {String} message Message text
       */
      socket.on('messages', function(messages) {
        io.in(socket.chatId).emit('event', {
          type: 'messages',
          messages: messages
        });
      });

      socket.on('disconnect', function() {
        console.log('disconnect');
        server.db.collection('users').update({_id: server.db.ObjectID(socket.decoded_token._id)}, {
          $set: {
            status: 'offline'
          }
        });
      });
    });
  });

};
