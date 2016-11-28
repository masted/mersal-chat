// Generated by CoffeeScript 1.11.1
(function() {
  module.exports = function(server) {
    var tts;
    tts = function(timestamp) {
      var date, formattedTime, hours, minutes;
      date = new Date(timestamp * 1000);
      hours = date.getHours();
      minutes = "0" + date.getMinutes();
      formattedTime = hours + ':' + minutes.substr(-2);
      return formattedTime;
    };
    server.app.get('/admin/stat', function(req, res) {
      return res.render('admin/stat');
    });
    return server.app.get('/admin/stat/data', function(req, res) {
      return server.db.collection('stat').find().limit(20).toArray(function(err, r) {
        var i, j, json, len, v;
        json = {
          lables: [],
          data: []
        };
        i = 0;
        for (j = 0, len = r.length; j < len; j++) {
          v = r[j];
          i++;
          json.lables.push(tts(v.time));
          json.data.push(v.memory);
        }
        return res.send(json);
      });
    });
  };

}).call(this);

//# sourceMappingURL=stat.js.map