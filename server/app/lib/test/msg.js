var assert = require('assert');
var ChatApp = require('../ChatApp');
var ChatActions = require('../actions/ChatActions');
var MessageActions = require('../actions/MessageActions');

describe('msg', function() {
  var userId1 = '57e9120d8e2016833717515f';
  var userId2 = '57e9123a8e20168337175160';
  // it('chat getOrCreateIdByFromToUsers', function(done) {
  //   new ChatApp().connectMongo(function(db) {
  //     var chatActions = new ChatActions(db);
  //     chatActions.cleanup(userId1, userId2, function() {
  //       chatActions.getOrCreateByTwoUser(userId1, userId2, function(chatId) {
  //         var messageActions = new MessageActions(db);
  //         messageActions.send(userId1, chatId, 'something else', function() {
  //           messageActions.getUnseen(userId2, chatId, function(messages) {
  //             if (messages[0].message != 'something else') done(1); else done();
  //           });
  //         });
  //       });
  //     });
  //   });
  // });
  it('message check status', function(done) {
    new ChatApp().connectMongo(function(db) {
      var chatActions = new ChatActions(db);
      chatActions.cleanup(userId1, userId2, function() {
        chatActions.getOrCreateByTwoUser(userId1, userId2, function(chatId) {
          var messageActions = new MessageActions(db);
          messageActions.send(userId1, chatId, 'something else', function(message) {
            done();
          });
          // var messageActions = new MessageActions(db);
          // messageActions.send(userId1, chatId, 'something else', function() {
          //   messageActions.getUnseen(userId2, chatId, function(messages) {
          //     if (messages[0].message != 'something else') done(1); else done();
          //   });
          // });
        });
      });
    });
  });
});
