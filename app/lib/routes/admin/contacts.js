module.exports = function(server){

  server.app.get('/admin/contacts/:userId', function(req, res) {
    res.render('admin/contacts/list', {
      userId: req.params.userId
    });
  });

  server.app.get('/admin/contacts/:userId/json_getItems', function(req, res) {
    var head = ['Phone'];
    var data = {};
    data.head = head;
    data.body = [];
    server.db.collection('contacts').find({
      userId: req.user._id.toString()
    }).toArray(function(err, contacts) {
      for (var i = 0; i < contacts.length; i++) {
        var item = {
          id: contacts[i]._id,
          data: {
            phone: contacts[i].phone
          }
        };
        data.body.push(item);
      }
      res.json(data);
    });
  });

};
