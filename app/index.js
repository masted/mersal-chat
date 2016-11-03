Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

// ----------

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient, assert = require('assert');
var ObjectID = mongodb.ObjectID;
var url = 'mongodb://localhost:27017/chat';
var db;

var jwt = require('jsonwebtoken');
var socketioJwt = require('socketio-jwt');
var jwtSecret = 'asd';

function dirname (path) {
  //  discuss at: http://locutus.io/php/dirname/
  // original by: Ozh
  // improved by: XoraX (http://www.xorax.info)
  //   example 1: dirname('/etc/passwd')
  //   returns 1: '/etc'
  //   example 2: dirname('c:/Temp/x')
  //   returns 2: 'c:/Temp'
  //   example 3: dirname('/dir/test/')
  //   returns 3: '/dir'

  return path.replace(/\\/g, '/')
    .replace(/\/[^\/]*\/?$/, '')
}

mongoClient.connect(url, function(err, _db) {
  console.log('mongo connected');
  db = _db;
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(dirname(__dirname) + '/doc'));
app.get('/doc', function(req, res) {
  res.sendFile(dirname(__dirname) + '/doc/index.html');
});

var push = function(user, msg) {

};

/**
 * @api {get} /api/v1/login/:login/:password Login
 * @apiDescription Token expiration time: 1 week
 * @apiName Login
 * @apiGroup Auth
 *
 * @apiParam {String} login User login
 * @apiParam {String} password User password
 * @apiParam {String} device ios/android
 * @apiParam {String} deviceToken (optional) Device Token for APN
 *
 * @apiSuccess {String} token Token that you will use in Socket.IO connection
 *
 * @apiSuccessExample Success-Response:
 *   HTTP/1.1 200 OK
 *   {"token": "your-token"}
 *
 * @apiErrorExample Error-Response:
 *   HTTP/1.1 404 Not Found
 *   {"error": "no user"}
 *
 * @apiSampleRequest http://chat.311.su:8080/api/v1/login
 */
app.get('/api/v1/login', function(req, res) {
  db.collection('users').findOne({
    login: req.query.login,
    password: req.query.password
  }, function(err, profile) {
    if (req.query.device != 'ios' && req.query.device != 'android') {
      res.status(404).json({error: 'wrong device'});
      return;
    }
    if (profile === null) {
      res.status(404).json({error: 'no user'});
      return;
    }
    profile.device = req.query.device;
    profile.deviceToken = req.query.deviceToken;
    var token = jwt.sign(profile, jwtSecret, {expiresIn: 60 * 60 * 24 * 7});
    res.json({token: token});
  });
});

//
//result.users = {};
//db.collection('users').findOne({
//  id: parseInt(req.query.fromUser)
//}, {
//  _id: 0
//}, function(err, r) {
//  result.users.from = r;
//  db.collection('users').findOne({
//    id: parseInt(req.query.toUser)
//  }, {
//    _id: 0
//  }, function(err, r) {
//    result.users.to = r;
//    // -----
//    res.send(result);
//  });
//});

/**
 * @api {get} /api/v1/user/info/:phone Get user info
 * @apiName GetUserInfo
 * @apiGroup User
 *
 * @apiParam {Number} phone User phone
 *
 * @apiSuccess {String} user JSON with user info
 *
 * @apiErrorExample Error-Response:
 *   HTTP/1.1 404 Not Found
 *   {"error": "error message"}
 *
 * @apiSampleRequest http://chat.311.su:8080/api/v1/user/info
 */
app.get('/api/v1/user/info', function(req, res) {
  console.log('get info');
  console.log(req.query);
  db.collection('users').findOne({
    phone: req.query.phone
  }, {
    _id: 0
  }, function(err, user) {
    if (!user) {
      res.status(404).send({error: 'no user'});
      return;
    }
    console.log(user);
    res.send(user);
  });
});

/**
 * @api {get} /api/v1/user/create/:phone/:login/:password Create user
 * @apiName Create
 * @apiGroup User
 *
 * @apiParam {Number} phone User Phone
 * @apiParam {String} login Login
 * @apiParam {String} password Password
 *
 * @apiSuccess {String} success The string "success" on success
 *
 * @apiErrorExample Error-Response:
 *   HTTP/1.1 404 Not Found
 *   {"error": "error message"}
 *
 * @apiSampleRequest http://chat.311.su:8080/api/v1/user/create
 */
app.get('/api/v1/user/create', function(req, res) {
  if (!req.query.phone) {
    res.status(404).json({error: 'phone is required'});
    return;
  }
  if (!req.query.login) {
    res.status(404).json({error: 'login is required'});
    return;
  }
  if (!req.query.password) {
    res.status(404).json({error: 'password is required'});
    return;
  }
  // check existence by phone
  db.collection('users').findOne({
    phone: req.query.phone
  }, function(err, user) {
    if (user) {
      res.status(404).send({error: 'user with a same phone already exists'});
      return;
    }
    // check existence by login
    db.collection('users').findOne({
      phone: req.query.login
    }, function(err, user) {
      if (user) {
        res.status(404).send({error: 'user with a same login already exists'});
        return;
      }
      // creation
      db.collection('users').insertOne({
        phone: req.query.phone,
        login: req.query.login,
        password: req.query.password
      });
      res.send('success');
    });
  });
});

var clean = function(obj) {
  for (var propName in obj) {
    if (!obj[propName]) {
      delete obj[propName];
    }
  }
};

var tokenReq = function(req, res, resCallback) {
  jwt.verify(req.query.token, jwtSecret, function(err, decoded) {
    if (!err) {
      resCallback(res, decoded);
    } else {
      res.send(err);
    }
  });
};

/**
 * @api {get} /api/v1/user/update/:name/:surname/:password Update user
 * @apiName Update
 * @apiGroup User
 *
 * @apiParam {String} token JWT token
 * @apiParam {String} login Login
 * @apiParam {String} phone Phone
 * @apiParam {String} name Name
 * @apiParam {String} surname Surname
 *
 * @apiSuccess {String} success The string "success" on success
 *
 * @apiErrorExample Error-Response:
 *   HTTP/1.1 404 Not Found
 *   {"error": "error message"}
 *
 * @apiSampleRequest http://chat.311.su:8080/api/v1/user/update
 */
app.get('/api/v1/user/update', function(req, res) {
  tokenReq(req, res, function(res, user) {
    var data = req.query;
    delete data.token;
    clean(data);
    db.collection('users').update({_id: ObjectID(user._id)}, {$set: data}, function(err, count) {
      if (count) res.send('success');
      else res.json({error: 'use not found'});
    });
  });
});

// ------------- upload section ----------------

var formidable = require('formidable');
var fs = require('fs');
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

/**
 * @api {post} /api/v1/user/upload Upload photo
 * @apiName Upload photo
 * @apiGroup User
 *
 * @apiParam {String} token JWT token
 * @apiParam {File} image Image (File via multipart/form-data)
 *
 */
app.post('/api/v1/user/upload', function(req, res) {
  tokenReq(req, res, function(res, user) {
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '/uploads');
    form.on('file', function(field, file) {
      fs.rename(file.path, path.join(form.uploadDir, file.name));
    });
    form.on('error', function(err) {
      console.log('An error has occured: \n' + err);
    });
    form.on('end', function() {
      res.end('success');
    });
    form.parse(req);
  });
});

// ----------------------------------------
app.get('/api/v1/upload', function(req, res) {
  res.sendFile(path.join(__dirname, 'upload.html'));
});

var apn = require('apn');

/**
 * @api {get} /api/v1/message/send/:fromUser/:toUser/:message Send a message
 * @apiName SendMessage
 * @apiGroup Message
 *
 * @apiParam {String} token JWT token
 * @apiParam {Number} toUser Recipient user ID
 * @apiParam {String} message Message text
 *
 * @apiSuccess {String} success The string "success" on success
 * @apiSampleRequest http://chat.311.su:8080/api/v1/message/send
 */
app.get('/api/v1/message/send', function(req, res) {
  tokenReq(req, res, function(res, user) {
    db.collection('messages').insertOne({
      fromUser: user._id,
      toUser: req.query.toUser,
      message: req.query.message,
      viewed: false
    });

    io.in('events' + req.query.toUser).emit('newMessage', {
      fromUser: req.query.fromUser
    });

    //var apnProvider = new apn.Provider({
    //  token: {
    //    key: "path/to/key.p8",
    //    keyId: "T0K3NK3Y1D",
    //    teamId: "T34M1D"
    //  },
    //  production: false
    //});
        //var note = new apn.Notification();
    //note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    //note.badge = 3;
    //note.sound = "ping.aiff";
    //note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    //note.payload = {'messageFrom': 'Chat'};
    //note.topic = "<your-app-bundle-id>";
    //
    //apnProvider.send(note, deviceToken).then(function(result) {});

    res.send('success');
  });
});

/**
 * @api {get} /api/v1/message/getNew/:fromUser/:toUser Getting new messages from chat (FOR DEBUG ONLY)
 * @apiName GetNew
 * @apiGroup Message
 *
 * @apiParam {Number} fromUser Sender user ID
 * @apiParam {Number} toUser Recipient user ID
 *
 * @apiSuccess {json} New messages
 * @apiSampleRequest http://chat.311.su:8080/api/v1/message/getNew
 */
app.get('/api/v1/message/getNew', function(req, res) {
  //
  var result = {};
  db.collection('messages').find({
    fromUser: req.query.fromUser,
    toUser: req.query.toUser,
    viewed: false
  }, {
    //_id: 0
  }).toArray(function(err, r) {
    assert.equal(null, err);
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

/**
 * @api {get} /api/v1/message/markAsViewed/:_ids Mark as viewed
 * @apiName MarkAsViewed
 * @apiGroup Message
 *
 * @apiParam {String} token JWT token
 * @apiParam {String} _ids Object IDs separeted by quote ",". ID is the "_id" param of Mongo Document
 * @apiSampleRequest http://chat.311.su:8080/api/v1/message/markAsViewed
 */
app.get('/api/v1/message/markAsViewed', function(req, res) {
  tokenReq(req, res, function(res, user) {
    var ids = req.query._ids.split(',');
    db.collection('messages').updateMany({'_id': new ObjectID.createFromHexString('57ea54fd8a2fef5fea82041f')}, {$set: {viewed: true}}, function(err, r) {
      console.log(r.result);
      res.send(r.result.n ? 'success' : 'failed');
    });
  });
});

/**
 * @api {ws} /socket.io Connection
 * @apiGroup Socket
 *
 * @apiDescription WebSocket API allows you to receive events from Chat Server in real time and send messages.
 *                 <h2>Basics</h2>
 *                 <p>To begin a WebSocket session use native Socket.IO client for your platform.
 *                 Once you have connected to the message server it will provide a stream of events.</p>
 *                 <p>If you connect successfully the first event received will be a "authenticated":</p>
 *                 <code>
 *                   {type: 'authenticated'}
 *                 </code><br><br>
 *                 <p>All events in Socket.IO client receives on 'event' event with a data in JSON format.
 *                 See the JS example:</p>
 *                 <code>
 *                   client.on('event', function(data) {
 *                     console.log('Event: ' + data.type);
 *                   });
 *                 </code><br><br>
 *                 <p>All commands in Socket.IO client sends as JSON with params from that API.
 *                 Commands marked as "emit" type. See the JS example:</p>
 *                 <code>
 *                   client.emit('eventName', {someParam: 'asd'})
 *                 </code><br><br>
 */
io.sockets.on('connection', socketioJwt.authorize({
  secret: jwtSecret,
  timeout: 15000 // 15 seconds to send the authentication message
})).on('authenticated', function(socket) {
  console.log('authenticated');

  console.log(socket.decoded_token);


  socket.emit('event', {type: 'authenticated'});

  /**
   * @api {emit} join Join a chat
   * @apiGroup Socket
   * @apiDescription Joins a chat
   * @apiExample {js} Example usage:
   *                  client.emit('join', {userId: 78888888888, chatId: 'chat79202560776'})
   *
   * @apiParam {String} userId User ID
   * @apiParam {String} chatId Chat ID
   */
  socket.on('join', function(chat) {
    console.log('joined ' + chat.chatId);
    socket.emit('event', {
      type: 'joined',
      chat: chat
    });

    socket.chatId = chat.chatId;
    socket.join(chat.chatId);
    var fromUserId = chat.chatId.replace(/chat(\d+)/, '$1');
    console.log('getting msgs from ' + fromUserId + ' to ' + chat.userId);
    // sending new messages from db to client
    db.collection('messages').find({
      fromUser: '' + fromUserId,
      toUser: '' + chat.userId,
      viewed: false
    }, {
      //_id: 0
    }).toArray(function(err, messages) {
      console.log(messages);
      io.in(socket.chatId).emit('event', {
        type: 'messages',
        messages: messages
      });
    });
  });

  /**
   * @api {emit} message Get new messages
   * @apiGroup Socket
   * @apiDescription Get a new messages from joined chat
   *
   * @apiParam {String} message Message text
   */
  socket.on('messages', function(messages) {
    io.in(socket.chatId).emit('event', {
      type: 'messages',
      messages: messages
    });
  });

});

http.listen(8080, function() {
  console.log('listening on *:8080');
});
