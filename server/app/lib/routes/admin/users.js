var Pagination = require('../../Pagination');

module.exports = function(server) {

  server.app.param('userId', function(req, res, next, userId) {
    server.db.collection('users').findOne({
      _id: server.db.ObjectID(userId)
    }, function(err, user) {
      if (err) return next(err);
      if (!user) return next({error: 'no error'});
      req.user = user;
      next()
    });
  });

  server.app.get('/admin/users', function(req, res) {
    if (!req.session || !req.session.admin) {
      res.status(404).send('access denied. <a href="/admin">auth</a>');
      return;
    }
    res.render('admin/user/list');
  });


  var getItemsRequest = function(req, res) {
    // if (!req.session || !req.session.admin) {
    //   res.status(404).json({error: 'access denied'});
    //   return;
    // }
    var head = ['ID', 'Phone', 'Login', 'Status'];

    var pagination = new Pagination({
      basePath: 'http://185.98.87.28:8081/admin/users/json_getItems'
    });
    var paginationData = pagination.data(req, 15);

    server.db.collection('users').find().skip(pagination.options.n * (paginationData.page - 1)).limit(pagination.options.n)
      .toArray().then(function(users) {
      var data = {};
      data.head = head;
      data.body = [];
      for (var i = 0; i < users.length; i++) {
        var item = {
          id: users[i]._id,
          tools: {
            delete: 'Delete',
            edit: 'Edit'
          },
          data: {
            id: users[i]._id,
            phone: users[i].phone,
            login: users[i].login,
            status: users[i].status
          }
        };
        data.pagination = paginationData;
        data.body.push(item);
      }
      res.json(data);
    });
  };

  server.app.get('/admin/users/json_getItems', function(req, res) {
    getItemsRequest(req, res);
  });
  server.app.get('/admin/users/json_getItems/pg:pg', function(req, res) {
    getItemsRequest(req, res);
  });

  server.app.get('/admin/users/json_new', function(req, res) {
    // if (!req.session || !req.session.admin) {
    //   res.status(404).json({error: 'access denied'});
    //   return;
    // }
    server.app.render('admin/user/form', {
      phone: '',
      login: '',
      password: ''
    }, function(err, html) {
      res.json({
        form: html,
        title: 'Create User'
      });
    });
  });

  server.app.post('/admin/users/json_new', function(req, res) {
    // if (!req.session || !req.session.admin) {
    //   res.status(404).json({error: 'access denied'});
    //   return;
    // }
    server.db.collection('users').insertOne({
      login: req.body.login,
      phone: req.body.phone,
      password: req.body.password
    }, function() {
      res.send('null');
    });
  });

  server.app.get('/admin/users/json_edit', function(req, res) {
    // if (!req.session || !req.session.admin) {
    //   res.status(404).json({error: 'access denied'});
    //   return;
    // }
    server.db.collection('users').findOne({
      _id: server.db.ObjectID(req.query.id)
    }, function(err, user) {
      if (!user) {
        res.status(404).send({error: 'no user'});
        return;
      }
      server.app.render('admin/user/form', user, function(err, html) {
        res.json({
          form: html,
          title: 'Edit User'
        });
      });
    });
  });

  server.app.post('/admin/users/json_edit', function(req, res) {
    // if (!req.session || !req.session.admin) {
    //   res.status(404).json({error: 'access denied'});
    //   return;
    // }
    server.db.collection('users').update({_id: server.db.ObjectID(req.query.id)}, {
      $set: {
        login: req.body.login,
        phone: req.body.phone,
        password: req.body.password
      }
    }, function(err, result) {
      if (result) {
        res.send('null');
      } else {
        res.json({error: 'user not found'});
      }
    });
  });

  server.app.get('/admin/users/ajax_delete', function(req, res) {
    // if (!req.session || !req.session.admin) {
    //   res.status(404).send('access denied');
    //   return;
    // }
    server.db.collection('users').remove({
      _id: server.db.ObjectID(req.query.id)
    });
    res.send('null');
  });

};