var request = require('supertest');
var app = require('./app');

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
      .expect(JSON.stringify(['Lotopia', 'Caspiana', 'Indigo']), done);
  });


});





