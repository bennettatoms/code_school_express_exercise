var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // have to mount it in our application
var urlencode = bodyParser.urlencoded({ extended: false }); // and specify what kind of encoding we're using

// begin Redis connection
var redis = require('redis');

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
  var client = redis.createClient();
  client.select((process.env.NODE_ENV || 'development').length);
}

// end Redis connection


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
  if (!newCity.name || !newCity.description) {
    response.sendStatus(400);
    return false;
  }
  client.hset('cities', newCity.name, newCity.description, function(error) {
    if (error) throw error;
    response.status(201).json(newCity.name);
  })
});

app.delete('/cities/:name', function(request, response) {
  client.hdel('cities', request.params.name, function(error) { // redis (and node-redis) hash delete command
    if (error) throw error;
    response.sendStatus(204);
  });
});

module.exports = app; // our application is encapsulated inside of a node module


