var startSocket = function(token, newMessagesCallback) {
  var socket = io.connect();
  socket.on('connect', function(data) {
    socket.emit('authenticate', {token: token}) //send the jwt
      .on('authenticated', function() {
        // Start receiving events for user userId
        socketEvent.event('join', {
          userId: 2,
          chatId: chatId
        });
        socket.on('event', function(data) {
          switch (data.type) {
            case 'joinError':
              break;
            case 'newMessages':
              newMessagesCallback(data);
              break;
          }
          console.log(data);
        });
      }).on('unauthorized', function(msg) {
      console.log("unauthorized: " + JSON.stringify(msg.data));
      throw new Error(msg.data.type);
    })
  });
};

var startChat = function(info, toUserId) {
  new Request.JSON({
    url: '/api/v1/login',
    onComplete: function(data) {
      new Request({
        url: '/api/v1/chat/getOrCreateIdByFromToUsers',
        onComplete: function(chatId) {
          startSocket(data.token, chatId);
        }
      }.get({
        fromUserId: data._id,
        toUserId: toUserId
      }));
    }
  }).get(info);
};
