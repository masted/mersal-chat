new Request({
  url: '/dev/cleanupChat/57e9120d8e2016833717515f/580b4d3d2aa614094c58cff5',
  onComplete: function() {
    var chat1, chat2, createdId, ids, user1, user2;
    user1 = {
      login: 'Anton',
      password: '888',
      device: 'android'
    };
    user2 = {
      login: 'sad',
      password: '123',
      device: 'android'
    };
    chat1 = new Chat(user1, '580b4d3d2aa614094c58cff5');
    chat1.start();
    chat2 = new Chat(user2, '57e9120d8e2016833717515f');
    chat2.start();
    chat1.bind('joined', function() {
      chat1.sendMessage('TEST');
    });
    var createdId;
    chat1.bind('newMessage', function(data) {
      createdId = data.message._id;
      chat1.socket.emit('markAsDelivered', data.message._id);
    });
    var ids;
    chat1.bind('delivered', function(data) {
      ids = data.messageIds;
    });
    setTimeout(function() {
      if (ids[0] !== createdId) throw new Error();
      else console.log('test passed');
    }, 1000);
  }
}).get();
