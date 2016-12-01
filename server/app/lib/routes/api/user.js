module.exports = function(server) {

  /**
   * @api {get} /user/info Get user info
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
   * @apiSampleRequest /user/info
   */
  server.app.get('/api/v1/user/info', function(req, res) {
    console.log('get info by ' + req.query.phone);
    server.db.collection('users').findOne({
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
   * @api {get} /user/create Create user
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
   * @apiSampleRequest /user/create
   */
  server.app.get('/api/v1/user/create', function(req, res) {
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
    server.db.collection('users').findOne({
      phone: req.query.phone
    }, function(err, user) {
      if (user) {
        res.status(404).send({error: 'user with a same phone already exists'});
        return;
      }
      // check existence by login
      server.db.collection('users').findOne({
        phone: req.query.login
      }, function(err, user) {
        if (user) {
          res.status(404).send({error: 'user with a same login already exists'});
          return;
        }
        // creation
        server.db.collection('users').insertOne({
          phone: req.query.phone,
          login: req.query.login,
          password: req.query.password
        });
        res.send('success');
      });
    });
  });

  /**
   * @api {get} /user/update Update user
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
   */
  server.app.get('/api/v1/user/update', function(req, res) {
    var clean = function(obj) {
      for (var propName in obj) {
        if (!obj[propName]) {
          delete obj[propName];
        }
      }
    };
    tokenReq(req, res, function(res, user) {
      var data = req.query;
      delete data.token;
      clean(data);
      server.db.collection('users').update({_id: server.db.ObjectID(user._id)}, {$set: data}, function(err, count) {
        if (count) res.send('success'); else res.json({error: 'user not found'});
      });
    });
  });

  /**
   * @api {post} /user/upload Upload photo
   * @apiName Upload photo
   * @apiDescription <a href="http://chat.311.su:8080/test/upload/user.html">Web example</a>
   * @apiGroup User
   *
   * @apiParam {String} token JWT token
   * @apiParam {File} image Image (File via multipart/form-data)
   */
  var formidable = require('formidable');
  var fs = require('fs');
  server.app.post('/api/v1/user/upload', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      var form = new formidable.IncomingForm();
      form.uploadDir = path.join(config.appFolder, '/public/uploads/user');
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

};