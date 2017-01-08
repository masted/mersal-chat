var config = require('./config');
config.appFolder = __dirname;
var ChatApp = require('./lib/ChatApp');

var ChatActions = require('./lib/actions/ChatActions');

new ChatApp(config).connectMongo(function(db) {
  new ChatActions(db).getByUser(
    '585e55053292d3f6a4a142e1',
    function(r) {
      console.log(r)
    }
  );
});
