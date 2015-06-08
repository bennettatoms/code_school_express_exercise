var express = require('express');
var app = express();

app.use(express.static('public'));

var cities = require('./routes/cities');
app.use('/cities', cities);

module.exports = app; // our application is encapsulated inside of a node module


