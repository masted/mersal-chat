var config = require('./config');
config.appFolder = __dirname;
var ChatApp = require('./lib/ChatApp');
new ChatApp(config).start();
