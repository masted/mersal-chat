module.exports = function(server) {

  /**
   * @api {get} /login/:login/:password Login
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
    server.db.collection('users').findOne({
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
      console.log(profile);
      var token = server.jwt.sign(profile, server.config.jwtSecret, {expiresIn: 60 * 60 * 24 * 7});
      res.json({
        token: token,
        _id: profile._id
      });
    });
  });

};