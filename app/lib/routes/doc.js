module.exports = function(server.app) {

  server.app.use(express.static(dirname(__dirname) + '/doc'));
  server.app.get('/doc', function(req, res) {
    res.sendFile(dirname(__dirname) + '/doc/index.html');
  });

};