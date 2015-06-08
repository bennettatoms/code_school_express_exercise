var express = require('express');

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

var router = express.Router();

router.route('/') // implied /cities because this is mounted on /cities in app.js's app.use('/cities', cities); 
  .get(function(request, response) {
    client.hkeys('cities', function(error, names) {
      if (error) throw error;
      response.json(names);
    });  
  })

  .post(urlencode, function(request, response) {
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

router.route('/:name')
  .delete(function(request, response) {
    client.hdel('cities', request.params.name, function(error) { // redis (and node-redis) hash delete command
      if (error) throw error;
      response.sendStatus(204);
    });
  })

  .get(function(request, response) {
    client.hget('cities', request.params.name, function(error, description) {
      response.render('show.ejs', 
                      { city: 
                        { name: request.params.name, description: description } 
                      }
      ); /* render function's first argument is template, second argument is the data that we want to pass through to the template */
    });
  });

module.exports = router;