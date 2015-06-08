var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // have to mount it in our application
var urlencode = bodyParser.urlencoded({ extended: false }); // and specify what kind of encoding we're using

app.use(express.static('public'));

app.get('/', function(request, response) {
  response.send('OK');
});

var cities = {
  'Lotopia':  'lotopia description',
  'Caspiana': 'caspiana description',
  'Indigo': 'indigo description'
};

app.get('/cities', function(request, response) {
  response.json(Object.keys(cities));
});

app.post('/cities', urlencode, function(request, response) {
  var newCity = request.body;
  cities[newCity.name] = newCity.description; // now treating cities like an object rather than array, so must change above
  response.status(201).json(newCity.name);
});

module.exports = app; // our application is encapsulated inside of a node module


