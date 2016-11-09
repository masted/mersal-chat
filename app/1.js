var url = 'mongodb://localhost:27017/chat';
var pdb = require('promised-mongo')(url);

pdb.collection('users');
pdb.collection('users').users.find().then(function(users) {
  console.log(users);
});


setTimeout(function() {
  console.log('!!');
}, 2000);

//pdb.collection('users').find().toArray().then(function(users) {
//  console.log('!');
//  console.log(users.length);
//});
