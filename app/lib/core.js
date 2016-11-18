module.exports = {

  tokenReq: function(req, res, resCallback) {
    var jwt = require('jsonwebtoken');
    var config = require('../config');
    jwt.verify(req.query.token, config.jwtSecret, function(err, decoded) {
      if (!err) {
        resCallback(res, decoded);
      } else {
        res.send(err);
      }
    });
  }

};