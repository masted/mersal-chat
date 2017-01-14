module.exports = function(server) {

  function genCode() {
    var text = "";
    var possible = "0123456789";
    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

  var smscSendCmd = function(res, cmd, arg) {
    var url = 'http://smsc.ru/sys/' + cmd + '.php?' + //
      'login=' + server.config.smscLogin + //
      '&psw=' + server.config.smscPassword + '&fmt=1&charset=utf-8&' + arg;
    var request = require('sync-request');
    var _res = request('GET', url);
    var result = _res.getBody().toString();
    if (!result) {
      res.status(404).json({error: 'request problem'});
      return;
    }
    var params = result.split(',');
    if (params[1] < 0) {
      console.log('SMSC RESULT: ' + result);
      res.status(404).json({error: 'SMSC: sending error'});
      return;
    }
    res.json({success: 1});
  };

  var sendSms = function(res, phone, message) {
    smscSendCmd(res, "send", "cost=3&phones=" + phone + "&mes=" + message + "&translit=0&id=0&sender=0&time=0");
  };

  /**
   * @api {get} /sendCode Send code
   * @apiDescription Sends code by SMS
   * @apiName SendCode
   * @apiGroup Auth
   *
   * @apiParam {String} phone User phone

   * @apiSuccess {String} result Result in JSON
   */
  server.app.get('/api/v1/sendCode', function(req, res) {
    console.log(123);
    if (!req.query.phone) {
      res.status(404).json({error: 'phone is required'});
      return;
    }
    var code = genCode();
    server.db.collection('phoneCodes').remove({
      phone: req.query.phone
    }, function() {
      var phoneCode = {
        phone: req.query.phone,
        code: code
      };
      server.db.collection('phoneCodes').insertOne(phoneCode, function(err, r) {
        server.db.collection('users').updateOne({
          phone: req.query.phone
        }, {
          phone: req.query.phone
        }, {
          upsert: true
        }, function() {
          sendSms(res, phoneCode.phone, phoneCode.code);
        });
      });
    });
  });

  /**
   * @api {get} /login Login
   * @apiDescription Token expiration time: 1 week
   * @apiName Login
   * @apiGroup Auth
   *
   * @apiParam {String} phone User phone
   * @apiParam {String} code SMS code
   * @apiParam {String} device ios/android
   *
   * @apiSuccess {String} token Token that you will use in Socket.IO connection
   *
   * @apiSuccessExample Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *     "token": "your-token",
   *     "_id": userId
   *    }
   *
   * @apiErrorExample Error-Response:
   *   HTTP/1.1 404 Not Found
   *   {"error": "no user"}
   */
  server.app.get('/api/v1/login', function(req, res) {
    if (req.query.debug) {
      server.db.collection('phoneCodes').findOne({
        phone: req.query.phone
      }, function(err, phoneCode) {
        if (!phoneCode) {
          res.status(404).json({error: 'wrong code or phone'});
          console.log('not found');
          return;
        }
        server.db.collection('users').findOne({
          phone: req.query.phone
        }, function(err, profile) {
          if (profile === null) {
            res.status(404).json({error: 'no user by phone ' + req.query.phone});
            return;
          }
          profile.device = req.query.device;
          profile.deviceToken = req.query.deviceToken;
          console.log('Login ' + profile.phone);
          var expiresIn = 60 * 60 * 24 * 7;
          var token = server.jwt.sign(profile, server.config.jwtSecret, {expiresIn: expiresIn});
          res.json(Object.assign({
            token: token,
            expiresIn: new Date() + expiresIn
          }, profile));
        });
      });
      return;
    }
    if (!req.query.phone) {
      res.status(404).json({error: 'phone is required'});
      return;
    }
    if (!req.query.code) {
      res.status(404).json({error: 'SMS code is required'});
      return;
    }
    if (req.query.device != 'ios' && req.query.device != 'android') {
      res.status(404).json({error: 'wrong device'});
      return;
    }
    server.db.collection('phoneCodes').findOne({
      code: req.query.code,
      phone: req.query.phone
    }, function(err, phoneCode) {
      if (!phoneCode) {
        res.status(404).json({error: 'wrong code or phone'});
        console.log('not found');
        return;
      }
      server.db.collection('users').findOne({
        phone: req.query.phone
      }, function(err, profile) {
        console.log('***************');
        console.log(profile);
        console.log('***************');
        if (profile === null) {
          res.status(404).json({error: 'no user by phone ' + req.query.phone});
          return;
        }
        profile.device = req.query.device;
        profile.deviceToken = req.query.deviceToken;
        console.log('Login ' + profile.phone);
        var expiresIn = 60 * 60 * 24 * 7;
        var token = server.jwt.sign(profile, server.config.jwtSecret, {expiresIn: expiresIn});
        res.json(Object.assign({
          token: token,
          expiresIn: new Date() + expiresIn
        }, profile));
      });
    });
  });

};