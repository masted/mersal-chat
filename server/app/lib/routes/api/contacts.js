module.exports = function(server) {

  /**
   * @api {get} /contacts/update Update contacts
   * @apiName UpdateContacts
   * @apiGroup Contacts
   *
   * @apiParam {String} token JWT token
   * @apiParam {Array} phones Phones separeted by quote ","
   *
   * @apiSuccess {String} json Existing contacts in recipient client list
   *
   */
  server.app.get('/api/v1/contacts/update', function(req, res) {
    if (!req.query.phones) {
      res.status(404).json({error: 'phones is required'});
      return;
    }
    server.tokenReq(req, res, function(res, user) {
      var phones = req.query.phones.split(',');
      var records = [];
      for (var i = 0; i < phones.length; i++) {
        records.push({
          userId: user._id,
          phone: phones[i]
        });
      }
      server.db.collection('contacts').insert(records, function(err, r) {
        server.db.collection('users').find({
          phone: {
            $in: phones
          }
        }, {
          _id: 1,
          phone: 1,
          login: 1
        }).toArray(function(err, users) {
          res.json(users);
          //console.log(users)
        })
      });
    });
  });

  /**
   * @api {get} /contacts/update Get contacts from incoming messages
   * @apiName GetFromMessages
   * @apiGroup Contacts
   *
   * @apiParam {String} token JWT token
   *
   * @apiSuccess {String} json Contacts
   */
  server.app.get('/api/v1/contacts/getFromMessages', function(req, res) {
    server.tokenReq(req, res, function(res, user) {
      server.db.collection('messages').distinct('userId', {
        toUserId: server.db.ObjectID(user._id)
      }, function(err, r) {
        console.log(r);
        res.json(r);
      });
    });
  });

};