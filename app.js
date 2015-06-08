var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // have to mount it in our application
var urlencode = bodyParser.urlencoded({ extended: false }); // and specify what kind of encoding we're using

var redis = require('redis');
var client = redis.createClient();

client.select((process.env.NODE_ENV || 'development').length);

client.hset('cities', 'Lotopia', 'lotopia description'); // see redis readme -- this sets hash in db
client.hset('cities', 'Caspiana', 'caspiana description');
client.hset('cities', 'Indigo', 'indigo description');

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.send('OK');
});

app.get('/cities', function(request, response) {
  client.hkeys('cities', function(error, names) {
    if (error) throw error;
    response.json(names);
  });  
});

app.post('/cities', urlencode, function(request, response) {
  var newCity = request.body;
  client.hset('cities', newCity.name, newCity.description, function(error) {
    if (error) throw error;
    response.status(201).json(newCity.name);
  })
});

module.exports = app; // our application is encapsulated inside of a node module


