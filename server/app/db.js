var config = require('./config');
config.appFolder = __dirname;
var ChatApp = require('./lib/ChatApp');

var MessageActions = require('./lib/actions/MessageActions');

new ChatApp(config).connectMongo(function(db) {
  (new MessageActions(db)).userSend('58789957dc5d097d5b2a138c', '58789a4ddc5d097d5b2a138e', '587e39df8561587ebb7fae1a', 'one check', false, function() {})

});
