var config = require('./config');
config.appFolder = __dirname;
var ChatApp = require('./lib/ChatApp');
new ChatApp(config).connectMongo(function(db) {
  db.collection('users').findOne({
    phone: '79202560776'
  }, function(err, r) {
    console.log('--');
    console.log(r);
    // - -
  });
});
