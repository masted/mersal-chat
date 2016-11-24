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

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

mongoClient.connect(url, function(err, db) {


  console.log('mongo connected');
  db.ObjectID = mongodb.ObjectID;


});

http.listen(config.port, function() {
  console.log('listening on *:' + config.port);
});
