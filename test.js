var request = require('supertest');
var app = require('./app');

var redis = require('redis');
var client = redis.createClient();
client.select('test'.length); // specifying test database -- database #4
client.flushdb();

describe('Requests to the root path', function() {

  it('Returns a 200 status code', function(done) {
    
    request(app)
      .get('/')
      .expect(200, done); // chain expectation of success
      // .end(function(error) {
      //   if(error) throw error;
      //   done(); // b/c JS is asynchronous, we need to tell mocha when our tests are complete
  });
  
  it('Returns HTML format', function(done) {

    request(app)
      .get('/')
      .expect('Content-Type', /html/, done);
  });

  it('Returns an index file with cities', function(done) {

    request(app)
      .get('/')
      .expect(/cities/i, done); // reg exp cities, irrespective of case
  });
});

describe('Listing cities on /cities', function() {

  it('Returns a 200 status code', function(done) {
    
    request(app)
      .get('/cities')
      .expect(200, done); // shorthand works the same as above, expect can take done() as its second or third argument
  });

  it('Returns JSON format', function(done) {

    request(app)
      .get('/cities')
      .expect('Content-Type', /json/, done);
  });

  it('Returns initial cities', function(done) {

    request(app)
      .get('/cities')
      .expect(JSON.stringify([]), done);
  });
});

describe('Creating new cities', function() {

  it('Returns a 201 status code', function(done) {
    
    request(app)
      .post('/cities/')
      .send('name=Springfield&description=where+the+simpsons+live') // the way we transmit the payload -- submitting form 
      .expect(201, done); // 201 is created successfully status code
  });

  it('Returns the city name', function(done) {

    request(app)
      .post('/cities')
      .send('name=Springfield&description=where+the+simpsons+live')
      .expect(/springfield/i, done); // return a string with case-insensitive springfield somewhere
  });

  it('Validates city name and description', function(done) {

    request(app)
      .post('/cities')
      .send('name=&description=')  // try to send empty name and description
      .expect(400, done); // 400 is a bad request
  });
});

describe('Deleting cities', function() {
  
  before(function() {
    client.hset('cities', 'Banana', 'a tasty fruit'); // add city to be deleted  
  });

  after(function() {
    client.flushdb(); // clear db after test runs so doesn't trip up other tests
  });

  it('Returns a 204 status code', function(done) { // 204 is successful, but doesn't return data
    
    request(app)
      .delete('/cities/Banana')
      .expect(204)
      .end(function(error) {
        if (error) throw error;
        done();
      });
  });
});

describe('Shows city info', function() {

  before(function() {
    client.hset('cities', 'Banana', 'a tasty city');
  });

  after(function() {
    client.flushdb();
  });

  it('Returns status code 200', function(done) {
    request(app)
      .get('/cities/Banana')
      .expect(200, done);
  });

  it('Returns HTML format', function(done) {
    request(app)
      .get('/cities/Banana')
      .expect('Content-Type', /html/, done);
  });

  it('Returns information for given city', function(done) {
    request(app)
      .get('/cities/Banana')
      .expect(/tasty/, done);

  });
});
