var config = require('./config');
config.appFolder = __dirname;
var ChatApp = require('./lib/ChatApp');
new ChatApp(config).connectMongo(function() {
  var UserMessage = require('./lib/UserMessage');
  new UserMessage()

  console.log('XXX');
});
