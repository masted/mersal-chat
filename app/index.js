// apidoc -f ".*index\\.js" -i app

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
function dirname(path) {
  return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '')
}
// ----------

var config = require('./config');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = 'mongodb://localhost:27017/chat';
var jwt = require('jsonwebtoken');

var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var assert = require('assert');

// ------------- Session
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
app.use(session({
  cookie: {maxAge: 1000 * 60 * 2},
  secret: "session secret",
  store: new MongoStore({
    db: 'chat',
    host: '127.0.0.1',
    port: 27017,
    collection: 'session',
    auto_reconnect: true,
    url: 'mongodb://localhost:27017/chat'
  })
}));
// -------------

var pdb = require('promised-mongo')(url);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var clean = function(obj) {
  for (var propName in obj) {
    if (!obj[propName]) {
      delete obj[propName];
    }
  }
};

mongoClient.connect(url, function(err, db) {
  console.log('mongo connected');
  db.ObjectID = mongodb.ObjectID;
  var server = require('./lib/Server')
  new server(config, app, db, io, jwt);
});

// mongoClient.connect(url, function(err, db) {
//   console.log('mongo connected');
//   db.ObjectID = mongodb.ObjectID;
//   // modules
//   require('./lib/routes/api/login')(app, db, config, jwt);
//   require('./lib/routes/api/user')(app, db);
//   require('./lib/routes/api/contacts')(app, db);
//   require('./lib/routes/api/message')(app, db, jwt);
//   require('./lib/routes/api/chat')(app, db);
//   require('./lib/routes/admin/login')(app);
//   require('./lib/routes/admin/users')(app, db);
//   require('./lib/routes/admin/contacts')(app, db);
//   require('./lib/routes/debug')(app);
//   require('./lib/socket')(io, db, config);
// });

http.listen(config.port, function() {
  console.log('listening on *:' + config.port);
});
