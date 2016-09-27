var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoClient = require('mongodb').MongoClient, assert = require('assert');
var url = 'mongodb://localhost:27017/chat';
var db;
mongoClient.connect(url, function(err, _db) {
  db = _db;
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('/home/user/marsel/chat/doc'));
app.get('/doc', function(req, res) {
  res.sendFile('/home/user/marsel/chat/doc/index.html');
});

/**
 * @api {get} /message/send/:fromUser/:toUser/:message Send message
 * @apiName SendMessage
 * @apiGroup Message
 *
 * @apiParam {Number} fromUser Sender user ID
 * @apiParam {Number} toUser Recipient user ID
 * @apiParam {String} message Message text
 *
 * @apiSuccess {String} success The string "success" on success
 * @apiSampleRequest http://chat.311.su:3000/message/send
 */
app.get('/message/send', function(req, res) {
  db.collection('messages').insertOne({
    fromUser: req.query.fromUser,
    toUser: req.query.toUser,
    message: req.query.message,
    viewed: false
  });
  console.log('sent');
  io.in('events' + req.query.toUser).emit('newMessage', {
    fromUser: req.query.fromUser
  });
  res.send('success');
});

/**
 * @api {get} /message/getNew/:fromUser/:toUser Getting new messages from chat
 * @apiName GetNew
 * @apiGroup Message
 *
 * @apiParam {Number} fromUser Sender user ID
 * @apiParam {Number} toUser Recipient user ID
 *
 * @apiSuccess {json} New messages
 * @apiSampleRequest http://chat.311.su:3000/message/getNew
 */
app.get('/message/getNew', function(req, res) {
  //
  var result = {};
  db.collection('messages').find({
    fromUser: req.query.fromUser,
    toUser: req.query.toUser,
    viewed: false
  }, {
    //_id: 0
  }).toArray(function(err, r) {
    result.messages = r;
    //
    result.users = {};
    db.collection('users').findOne({
      id: parseInt(req.query.fromUser)
    }, {
      _id: 0
    }, function(err, r) {
      result.users.from = r;
      db.collection('users').findOne({
        id: parseInt(req.query.toUser)
      }, {
        _id: 0
      }, function(err, r) {
        result.users.to = r;
        // -----
        res.send(result);
      });
    });
  });

});

app.get('/message/markAsViewed', function(req, res) {
  var ids = req.query._ids.split(',');
  db.collection('messages').updateMany({_id: '57ea54fd8a2fef5fea82041f'}, {$set: {viewed: true}}, function(err, r) {
    console.log(r.result);
    res.send('success');
  });
});

io.sockets.on('connection', function(socket) {
  socket.on('join', function(room) {
    console.log('joined ' + room);
    socket.room = room;
    socket.join(room);
  });
  socket.on('message', function(message) {
    // sending real-time messages
    io.in(socket.room).emit('message', message);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
