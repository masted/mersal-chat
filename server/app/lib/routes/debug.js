module.exports = function(server) {

  server.app.get('/upload', function(req, res) {
    res.sendFile(path.join(__dirname, 'upload.html'));
  });

};