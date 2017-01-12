var Pagination = require('../../Pagination');

module.exports = function (server) {
  var getItemsRequest = function(req, res) {
    var pagination = new Pagination({
      basePath: 'http://185.98.87.28:8081/admin/logs/json_getItems'
    });
    var dateFormat = require('dateformat');
    server.db.collection('logs').count(function (err, count) {
      var paginationData = pagination.data(req, count);
      server.db.collection('logs').
      find().sort({dt: -1}).//
      skip(pagination.options.n * (paginationData.page - 1)).//
      limit(pagination.options.n).//
      toArray().then(function (logs) {
        var data = {};
        data.head = ['Date', 'URL', 'Code', 'Body'];
        data.body = [];
        for (var i = 0; i < logs.length; i++) {
          var item = {
            id: logs[i]._id,
            tools: {
              details: {
                title: 'Details',
                cls: 'search-plus'
              }
            },
            data: {
              dt: dateFormat(logs[i].dt, "yyyy-mm-dd HH:MM"),
              url: logs[i].url,
              code: logs[i].code,
              body: logs[i].body
            }
          };
          data.body.push(item);
        }
        data.pagination = paginationData;
        res.json(data);
      });
    });
  };
  server.app.get('/admin/logs/json_getItems', function (req, res) {
    getItemsRequest(req, res);
  });
  server.app.get('/admin/logs/json_getItems/pg:pg', function(req, res) {
    getItemsRequest(req, res);
  });

};