module.exports = function(server) {
  var socketioJwt = require('socketio-jwt');
  var MessageActions = require('../../actions/MessageActions');
  var messageActions = new MessageActions(server.db);

  server.event.on('newMessage', function(message) {
    var clients = server.io.sockets.adapter.rooms[message.chatId];
    if (!clients) return;
    if (clients.sockets.length === 0) return;
    var userMessages = {}
    var userMessage;
    var socket;
    messageActions.getViewStatuses(message._id, function(statuses) {
      for (var j =0; j<statuses.length; j++) {
        userMessage = Object.assign({}, message);
        userMessage.viewed = statuses[j].viewed;
        userMessages[statuses[j].ownUserId] = userMessage;
      }
      for (var socketId in clients.sockets) {
        socket = server.io.sockets.connected[socketId];
        if (!userMessages[socket.userId]) continue;
        socket.emit('event', {
          type: 'newMessage',
          message: userMessages[socket.userId]
        });
      }
    });
  });

  /**
   * @api {ws} /socket.io Overview
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
   *                 <h2>Events:</h2>
   *                 <code>{type: 'joined'}</code><br>
   *                 <code>{type: 'newMessage', message: {...}}</code>
   *                 </code>
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
        var messageActions = new MessageActions(server.db);
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
            // new MessageActions(server.db).getUnseen(userId, data.chatId, function(messages) {
            //   server.io.in(data.chatId).emit('event', {
            //     type: 'messages',
            //     messages: messages
            //   });
            // });
          }
        });
      });

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
