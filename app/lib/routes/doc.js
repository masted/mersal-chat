module.exports = function(server) {
  var express = require('express');
  var path = require('path');
  var docFolder = path.normalize(server.config.appFolder + '/../doc');
  server.app.use(express.static(docFolder));
  server.app.get('/doc', function(req, res) {
    res.sendFile(docFolder + '/index.html');
  });

};