# ExpressJS Code School Notes 
### (from Building Blocks of Express course, based on express 4.9)

ExpressJS is a flexible, minimal web framework built on top of NodeJS, similar to Rails for Ruby.

## First Steps

Installing express:

$ npm install express // installs most recent version
$ npm install express@4.9 // installs latest version from 4.9 branch
$ npm install express@3.15.2 // installs specific version

var express = require('express'); // require express library, returns function
var app = express(); // runs returned function, gives us application instance

On the app object, we can call functions that create routes (app.get creates roites that respond to http get requests, app.post, app.put, app.patch, app.delete) do accordingly)

app.get('/', function(request, response) {
  response.send('Hello world'); /* callback that runs each time the app 
                                  receives a get request on the root path */
});
app.listen(3000, function() {
  console.log('Listening on port 3000...')
}); // binds application instance to TCP port 3000



Listen function takes an optional callback function that will run when the application is ready to receive requests.

To start the server:
$ node app.js // will return 'Listening on port 3000...'

To issue requests, we'll use curl: 
$ curl http://localhost:3000/ // returns 'Hello world' server response

Whenever we change code in our application, we have to restart the server. ctrl-C to shut down.

Express extends NodeJS. The request and response objects actually inherit from Node's 'http' module:
var req = exports = module.exports = {
  __proto__: http.IncomingMessage.prototype // IncomingMessage is a Node object
};
var res = exports = module.exports = {
  __proto__: http.ServerResponse.prototype // ServerResponse is a Node object
};

### Calling Node's HTTP functions

The inheritance gives us the ability to call Node functions from express apps. e.g.:

var express = require('express');
var app = express();

app.get('/', function(request, response) {
  response.write('Hello world');
  response.end();
});

response.write() and response.end() are both Node functions, and they combine to be equivalent to response.send() -- in Express API

### Responding with JSON

The send() function converts <strong>Objects and Arrays</strong> to JSON

app.get('/blocks', function(request, response) {
  var blocks = ['Fixed', 'Movable', 'Rotating'];
  response.send(blocks); /* automatically serializes array to JSON and 
                            configures response headers automatically */
});

Now we can send request to the server using curl -i (the -i tells server to include response headers in response):

$ curl -i http://localhost:3000/blocks 
  ==> HTTP/1.1 200 OK
      X-Powered-By: Express
      Content-Type: application/json; charset=utf-8

      ["Fixed", "Movable", "Rotating"] 

Can also use response.json() for objects and arrays, and you get the exact same JSON response back from server.

But, if you use send() function to send a <strong>string or html</strong> to the server, the server will respond with text/html:

app.get('/blocks', function(request, response) {
  var blocks = 'ul li Fixed /li li Movable /li /ul'; // imaginary brackets!
  response.send(blocks);
}); 

$ curl -i http://localhost:3000/blocks 
  ==> HTTP/1.1 200 OK
      X-Powered-By: Express
      Content-Type: text/html; charset=utf-8

      ul li Fixed /li li Movable /li /ul

* Responding with html straight from our routes is not something we typically want to do in Express applications. If you want to do server-side rendering, can instead look into templating libraries like EJS (embedded JavaScript) or Jade.

If we want to move an existing route to a new location, we need to set up a redirect (with handy redirect() function):

app.get('/blocks', function(request, response) {
  response.redirect('/parts'); /* next time request comes in for /blocks, will 
                                  be redirected to /parts instead */
});

$ curl -i http://localhost:3000/blocks
  ==> HTTP/1.1 302 Moved Temporarily
      X-Powered-By: Express
      Location: /parts
      Content-Type: text/plain; charset=utf-8

      Moved Temporarily. Redirecting to /parts

Note that the above only temporarily provides for redirect. For a permanent redirect, can include status 301 in redirect parameters:

app.get('/blocks', function(request, response) {
  response.redirect(301, '/parts'); // optional staus code 301
});

$ curl -i http://localhost:3000/blocks
  ==> HTTP/1.1 301 Moved Permanently
      X-Powered-By: Express
      Location: /parts
      Content-Type: text/plain; charset=utf-8

      Moved Permanently. Redirecting to /parts

## Middleware! (How do they work?)

Middleware are the building blocks of Express. They allow for rich, interactive JavaScript applications.

In typical JS application, the client (browser) issues an initial request to a server, which returns an index.html document. The browser then renders that document. From there, the client will issue AJAX requests to the server, which will respond with JSON data to be parsed by the client and rendered onto the page without a full page refresh.

Start with index.html file:

--app.js
--public/
  --index.html

 !DOCTYPE html 
 html lang="en" 
 head 
   meta charset="UTF-8" 
   title Building Blocks /title 
 /head 
 body 
   h1 Blocks /h1 
 /body 
 /html 

To serve the index.html file, we need to configure server in app.js:

var express = require('express');
var app = express();

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
  response.end();
});
app.listen(3000);

'__dirname' indicates the name of the directory the currently executing script resides in.

Alternately, we can use Express's static middleware, which is the only middleware that Express is currently shipped with:

var express = require('express');
var app = express();

app.use(express.static('public')); /* pass it the root folder where we want to 
                                      serve static files from */

app.listen(3000);

* The app.use() function adds middleware to the application stack.

What is middleware? <strong>Middleware in Express are functions added to the stack that have access to the request and response objects, and that are executed sequentially</strong>

e.g.: Client issues request to Express, then request passes through each of the following: 
  - middleware A handles validation
  - middleware B handles authentication
  - middleware C handles data parsing
  - app.get('/blocks', ... )

An Express applicatioon is essentially a stack of middleware acting one after the other. Think of it like a plumbing pipe; requests start at the first middleware and work their way down the stack.

Add middleware A (the first middleware a request must pass through) to the stack with the app.use() function:

app.use(function(request, response, next) {
  ...
  next(); /* the next function <strong>must</strong> be called to send to the next middleware in sequence */
});

then request is processed through middleware B, which again calls next() and sends the request to middleware C, and so on, until the request reaches the point where the server responds back to the client. The middleware sequence runs until there is a response.send('blah!') back to the client. Even if there is a next() function to follow, the remaining middleware will not run, and you'll get all sorts of weird errors.

### Reading the static Middleware source code
#### [source](http://github.com/expressjs/serve-static)
The static Middleware is a good example of Express Middleware. From index.js:

exports = module.exports = function serveStatic(root, options) {
  ...
  return function serveStatic(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    ...
    stream.pipe(res);
  }
}

Static only cares about GET or HEAD requests, otherwise it calls next() and immediately passes processing to whoever is next on the stack. Otherwise, it does its work and at the bottom of the file you see the send stream that pipes its content to the response object.

### Serving static assets

The static middleware serves <strong>everything</strong> under the specified folder.

--app.js
--public/
  --index.html
  --blocks.jpg

app.use(express.static('public'));

 !DOCTYPE html 
 html lang="en" 
 head 
   meta charset="UTF-8" 
   title Building Blocks /title 
 /head 
 body 
   h1 Blocks /h1 
   p  img src="blocks.jpg"  /p 
 /body 
 /html 

So, now the static middleware serves everything in the public folder that's referred to in the index.html file. We have a header that says 'Blocks', and below that, the blocks.jpg image is displayed.

Now we know how to serve static files using middleware, it's time to learn how to <strong>load data from Express using AJAX calls</strong>.

### Loading Data Using AJAX

#### Add client-side JavaScript
 !DOCTYPE html 
 html lang="en" 
 head 
   meta charset="UTF-8" 
   title Building Blocks /title 
   link rel="stylesheet" href="style.css" 
 /head 
 body 
   h1 Blocks /h1 
   ul class="block-list"  /ul 
   script src="jquery.js"  /script   <!-- add this to manipulate DOM --> 
   script src="client.js"  /script   <!-- our client-side JS code -->
 /body 
 /html 

--app.js
--public/
  --bg-stars.png
  --client.js
  --index.html
  --jquery.js
  --style.css

^^^ all files in public folder will be served by Express's static middleware

#### Making AJAX calls

in client.js:

$(function(){
  
  $.get('/blocks', appendToList); // /blocks call should return list of blocks

  function appendToList(blocks) { /* function creates empty array of blocks, 
                                     then iterates through each of the blocks and creates an li element for each one */
    var list = [];
    for(var i in blocks) {
      list.push($('<li>', {text: blocks[i] }))
    }
    $('.block-list').append(list);  /* finally, we append the li elements to 
                                       the ul with class 'block-list' */
  }
});

#### Responding with JSON

in app.js, we'll create a new route for our /blocks endpoint:

var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/blocks', function(request, response) {
  var blocks = ['Fixed', 'Movable', 'Rotating'];
  response.json(blocks); /* creates an array of blocks and serializes it back 
                            to the client using the json() function */
});

app.listen(3000);

Now when you load http://localhost:3000/, you can check Chrome's dev tools to see what resources the browser refers to when loading the page. In the Network tab, the browser loads style.css, jquery.js, client.js, bg-stars.png(backkground image), and blocks (the /blocks endpoint). If you Preview the blocks info, it shows you the JSON that the server responded with: the array of blocks.

## Building Our Own Custom Middleware

A logger that reports the duration for each request:

Start new file, logger.js, on same level as logger.js and public folder.

module.exports = function(request, response, next) { /* makes accessible to 
                                                        other files */
  var start = +new Date(); /* Use Date object to track the exact start time of 
                              request -- + sign converts to milliseconds*/
  var stream = process.stdout; /* write log messages to standard output -- a 
                                writeable stream accessed by stdout property */
  var url = request.url;
  var method = request.method; // GET, POST, whatevs
  response.on('finish', function() { // event listener for end of request
    var duration = +new Date() - start; // calculates duration
    var message = method + ' to ' + url + '\ntook ' + duration + ' ms \n\n';
    stream.write(message); // prints the log message to standard out
  });
  next(); // so process doesn't get hung up in our middleware
}

Now we can require and use our logger module in our app.js:

var logger = require('./logger');
app.use(logger); // add logger module to the stack

http://github.com/expressjs/morgan ==> check out for an excellent logger solution

## User Params -- Reading from the URL

Right now when user requests /blocks, we're sending back all the blocks (response.json(blocks);). To improve efficiency, we want to be able to limit the number of results returned.

### Use query strings to 'limit' the number of results:

request: GET to /blocks
response: ['Fixed', 'Movable', 'Rotating'] // returns all results

request: GET to /blocks?limit=1
response: ['Fixed'] // returns first result

request: GET to /blocks?limit=2
response: ['Fixed', 'Movable'] // returns two results

### Use request.query to access query strings:

var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/blocks', function(request, response) {
  var blocks = ['Fixed', 'Movable', 'Rotating'];
  if (request.query.limit >= 0) { /* true when a numeric value for limit is 
                                     part of the URL */
    response.json(blocks.slice(0, request.query.limit)); /* slice function 
                                                            takes two arguments (where extraction begins, where extraction ends -- excluding end number), so pulls blocks from 0 to limit value - 1 */ 
  } else {
    response.json(blocks); 
  }
});
app.listen(3000);

### Returning description for a specific Block
We can use <strong>meaningful URLs</strong> to return the description for specific types of Blocks:

request: GET to /blocks/Fixed
response: 200 Success
          "Fastened securely in position" // description for the Fixed block


request: GET to /blocks/Movable
response: 200 Success
          "Capable of being moved" // description for the Movable block

How to do the above without creating individual static routes for every type of block? Dynamic routes.

### Creating Dynamic Routes

In order to store additional information on blocks, we'll move from a JavaScript array to  a JavaScript object:
var blocks = ['Fixed', 'Movable', 'Rotating'] 

-becomes- 

var blocks = {
  'Fixed': 'Fastened securely in position', 
  'Movable': 'Capable of being moved', 
  'Rotating': 'Moving in a circle around its center'
}

var express = require('express');
var app = express();

var blocks = {
  'Fixed': 'Fastened securely in position', 
  'Movable': 'Capable of being moved', 
  'Rotating': 'Moving in a circle around its center'
}

app.get('/blocks/:name', function(request, response) {
  var description = blocks[request.params.name];
  response.json(description);  // defaults to 200 Success status code
});
app.listen(3000);

$ curl -i http://localhost:3000/blocks/Fixed
  ==> HTTP/1.1 200 OK
      'Fastened securely in position'

Also need to provide for scenario where user requests a Block url that does not exist -- invalid URL:

$ curl -i http://localhost:3000/blocks/Banana
  ==> HTTP/1.1 200 OK
      [blank response body]

Must return a 40 status code and an informative error message when a Block is not found.

app.get('/blocks/:name', function(request, response) {
  var description = blocks[request.params.name]; /* returns undefined when we 
                                                    get request for a Block name that doesn't exist */
  if (!description) { // undefined evaluates to false
    response.status(404).json('No description found for ' + request.params.name); // response has built-in status function
  } else {
    response.json(description);
  }
});

### Massaging User Data

Controlling for differences in case -- Normalizing parameters

Refactor previous code:
var blocks = {
  'Fixed': 'Fastened securely in position', 
  'Movable': 'Capable of being moved', 
  'Rotating': 'Moving in a circle around its center'
}

app.get('/blocks/:name', function(request, response) {
  // var description = blocks[request.params.name]; /* refactor -- doing two 
                                                    things at once */
  var name = request.params.name;
  var block = name[0].toUpperCase() + name.slice(1).toLowerCase(); 
      /* Normalize the name of the block by converting the first character to uppercase and all characters from index 1 on to lowercase*/
  response.json(description);  
});

The normalizing code above is probably something you'll want to reuse in other functions, but don't want to copy and paste code all over the place. Express has a built-in <strong>app.param</strong> function that maps placeholders
to callback functions. It's useful for running <strong>pre-conditions</strong> on dynamic routes. Syntax is app.param([object to be normalized], [middleware] function(request, response, next) { ... })

var blocks = { ... };

var locations = {
  'Fixed': 'First floor', 'Movable': 'Second floor', 'Rotating': 'Third floor'
};

app.param('name', function(request, response, next) { 
  var name = request.params.name;
  var block = name[0].toUpperCase() + name.slice(1).toLowerCase();
  request.blockName = block;  /* sets normalized Block name as a property of 
                                 the request object. Now it can be accessed from other routes in the application */
  next();
});

app.get('/blocks/:name', function(request, response) {
  var description = blocks[request.blockName];
  ...
;})

app.get('/locations/:name', function(request, response) {
  var description = locations[request.blockName];
  ...
;})

In our app, when we go back to the /blocks endpoint, it used to list out the block names, but now it lists the block descriptions (since we changed blocks from an array of names to an object with names and descriptions).

app.get('/blocks', function(request, response) {
  var blocks = ['Fixed', 'Movable', 'Rotating'];
  ...
    // response.json(blocks); // now serializes the blocks object
    response.json(Object.keys(blocks)); /* Object.keys returns an array with 
                                           the object's properties */
  ...
});
app.listen(3000);

## POST and DELETE Requests

Learn how to create routes for POST and DELETE requests. Then see how we can use the body parser in middleware to read form-submitted data, and then generate responses with the proper HTTP status code.

### Creating new Blocks

1) We need a new form
2) We need to create a POST route

We'll be sending POST requests to the /blocks route with the name and description as the payload of the request. The response on success will be a 201 Created status code, with the Block name as the response body.

First, we'll add a form to our index.html:

body
  h1 blocks /h1

  form
    legend New Block /legend
    input name="name" placeholder="Name"
    input name="description" placeholder="Description"
    input type="Submit"
  /form

  ul class="block-list" /ul
  ...

Define form attributes in JavaScript in client.js. Add form submit event listener:

$.get('/blocks', appendToList); // appendToList function above
  ...
$('form').on('submit', function(event) {
  event.preventDefault(); // prevent form from being immediately submitted
  var form = $(this);
  var blockData = form.serialize(); /* serialize transforms form data to url-
                                       encoded notation, so Express app can parse it back to JavaScript */
  $.ajax({
    type: 'POST', url: '/blocks', data: blockData
  }).done(function(blockName) {
    appendToList([blockName]); /* appendToList function outlind above expects 
                                  an array of block items rather than a single block object, so we get around this by wrapping our single block object in an array with itself as the sole argument */
    form.trigger('reset'); // clears form text inputs after submit
  })
})

One last thing, to add a link to the Block-specific url to each of the Block names in the list, so we'll address that in the appendToList function:

$(function(){
  
  $.get('/blocks', appendToList); 

  function appendToList(blocks) { 
    var list = [];
    for(var i in blocks) {
      block = blocks[i];
      content = '<a href="/blocks/' + block + '">' + block + '</a>';
      list.push($('<li>', { html: content }))
    }
    $('.block-list').append(list);  
  }
});

Now on server side, in **app.js**:
* Parsing depends on middleware that's not shipped with Express, so we need to install body-parser: $ npm install body-parser ... Then:

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({ extended: false }); 
    /* call urlendoded function -- setting the extended option to false forces Express to use Node's native query parser module, the querystring library -*/
    /* the return value of the urlencoded function is a middleware function which we store in the parseUrlencoded variable */
var blocks = { ... };

app.post('/blocks', parseUrlencoded, function(request, response) { ... });
    /* routes can take multiple handlers as arguments, which get executed sequentially, so we pass the request through the parseUrlencoded function first, then send the returned value to the callback (where we implement the creation of a new Block) */


<strong>The ability to have multiple route handlers is useful for re-using middleware that load resources, perform validations, authentication, etc.</strong>

app.post('/blocks', parseUrlencoded, function(request, response) { 
  var newBlock = request.body; /* request.body returns form data -- each 
                                  element in the form becomes a property in the object, name and description -- we'll use those to add a new block in the blocks object */
  blocks[newBlock.name] = newBlock.description;
  response.status(201).json(newBlock.name); // sets the Created status code
});

### Deleting Blocks

Next to each of the Blocks in the list we'll want a button/link to delete them. On the client side, we'll need to set the buttons up to remove the Block item on click (along with promtping a confirmation to delete or cancel), and on the server /API side, send a DELETE request to the server to remove the selected item from the server and get back a 200 OK status code.

Client side, in appendToList function inside **client.js**:

$(function(){
  ...
  function appendToList(blocks) { 
    var list = [];
    for(var i in blocks) {
      block = blocks[i];
      content = '<a href="/blocks/' + block + '">' + block + '</a>' + '<a href="#" data-block="' + block + '"><img src="del.jpg"></a>';
      list.push($('<li>', { html: content }))
    }
    $('.block-list').append(list); 
  };
  $('.block-list').on('click', 'a[data-block]', function(event) { 
      /* a[data-block] are any links with a <strong>data-block</strong>   
         attribute */
    if (!confirm('Are you sure?')) {
      return false; // stop executing event handler
    }

    var target = $(event.currentTarget);

    $.ajax({
      type: 'DELETE', url: '/blocks/' + target.data('block') /* reads the name 
                                                                of the block from the target link's data-block attribute */
    }).done(function() {
      target.parents('li').remove(); // remove the list item from the page
    });
  });
});

Server side, in app.js:

var express = require('express');
var app = express();
...
var blocks = { ... };

app.delete('/blocks/:name', function(request, response) { 
  delete blocks[request.blockName]; /* blockName comes from app.param 
                                       middleware function */
  response.sendStatus(200); /* use sendStatus() rather than status() when we 
                               don't want to manually set a response body -- some clients, like jQuery, cannot handle empty responses very well, so sendStatus sets the response as 200 OK */
});
    
## Route Instances

Right now we have similar route pathways for multiple different purposes/HTTP requests. Not ideal.

app.get('/blocks'....
app.get('/blocks/:name'
app.post('/blocks'....
app.delete('/blocks/:name'....

We can use app.route to avoid using duplicate route names, creating route instances:

var express = require('express');
var app = express();

app.route('/blocks') /* no semi-colon -- chained function that takes the path 
                        as an argument and handles all requests to the given path */
  .get(function(request, response) {
    ...
  })
  .post(parseUrlencoded, function(request, response) {
    ...
  });
app.listen(3000);

Chaining means calling functions on the return value of previous functions. Lines starting with '.' indicate function calls on the object returned from the previous line.

### Dynamic route instances

app.route('/blocks/:name') 
  .get(function(request, response) {
    ...
  })
  .delete(parseUrlencoded, function(request, response) {
    ...
  });
app.listen(3000);

app.js is getting to be too long, so we can extract routes into modules. This will help clean up our code and allow our main app.js file to accommodate additional routes in the future.

var express = require('express');
var app = express();

app.use(express.static('public'));

var blocks = require('./routes/blocks'); // we move routes to new file
app.use('/blocks', router); // router is mounted in a particular root url
app.listen(3000);

So we'll create a routes diredctory on the same level as app.js and public, and inside we'll put the different files for route modules, which will use the Express Router() function. We'll want to have all blocks-related logic encapsulated in this file. In this case, blocks.js:

var express = require('express');
var router = express.Router(); /* returns router function that can be mounted 
                                  as a middleware */
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({ extended: false });

var blocks = {
  'Fixed': 'Fastened securely in position', 
  'Movable': 'Capable of being moved', 
  'Rotating': 'Moving in a circle around its center'
}

router.route('/') /* the router path is relative to where it's mounted -- it's 
                     mounted on root url '/blocks' per the above: app.use('/blocks', blocks); */
  .get(function(request, response) {
    ...
  })
  .post(parseUrlencoded, function(request, response) {
    ...
  });

router.route('/:name') 
  .all(function(request, response, next) { /* the all route is called for all 
                                              requests (matches all HTTP verbs) on a given path -- alternative to app.param -- we'll drop in the code that used to be in app.param */
    var name = request.params.name;
    var block = name[0].toUpperCase() + name.slice(1).toLowerCase();  
    request.blockName = block; /* params run through this .all function before 
                                  filtering to the appropriate route */
    next();
  })
  .get(function(request, response) {
    ...
  })
  .delete(parseUrlencoded, function(request, response) {
    ...
  });

module.exports = router; // exports the router as a Node module

Now the router module is ready to be exported and required in app.js, which is much cleaner and can easily be edited to add additional routes, e.g. '/buildings' or '/users' -- in the same way:

var buildings = require('./routes/buildings');
var users = require('./routes/users');
app.use('/buildings', buildings);
app.use('/users', users);

# ExpressJS - Soup to Bits (Code School)
## Adding Testing, Validations, Redis Database, and EJS for templating

mkdir whatevs and cd into it...
$ npm init
then set follow-up questions to whatever to initiate your package.json file

$ npm install express@4 --save (latest version in 4's, save to package.json)

$ less package.json (like cat, can see that express has been added as dependency)

$ vim app.js (creates app.js and opens in vim for editing)

$ git init

Don't necessarily want to keep node-modules in git repository -- as long as you have package.json, if you fork the app npm install will install necessary dependencies

$ npm shrinkwrap 

locks down the versions of each of our dependencies -- so every time we run npm install, the dependencies will always be installed in the correct versions. Need to run the command again every time you add a production (not development) dependency. Only stores production dependencies.

$ echo node-modules >> .gitignore

Download packages and add first tests (which will call go in tests.js)

$ vim test.js
/*
var request = require('supertest');
var app = require('./app');

request(app)
  .get('/')
  .expect(200) // chain expectation of success
  .end(function(error) {
    if(error) throw error;
    console.log('Done');
  });

*/

change app.js to make encapsulate it in a node module, so remove 'app.listen...' and replace with 'module.exports = app;'

$ vim bin/www
/*
line 1 - #!/usr/bin/env node

var app = require('./../app');
app.listen(3000, function() {
  console.log('Listening on port 3000');
});
*/

$ chmod +x bin/www (make the www file executable, to set up proxy on localhost:3000)

Now we'll fire up our server using:
$ ./bin/www (now should return to console 'Listening on port 3000', and if you $ curl http://localhost:3000, it returns 'OK')

$ npm install supertest --save-dev (saves to package.json in dev dependencies -- not production)

$ npm install mocha --save-dev
We'll write our tests in mocha (in test.js):

/*
describe('Requests to the root path', function() {

  it('Returns a 200 status code', function(done) {
    
    request(app)
      .get('/')
      .expect(200) // chain expectation of success
      .end(function(error) {
        if(error) throw error;
        done();
      });
  
  });
});
*/

... but right now have to use the following to run tests:
$ ./node_modules/mocha/bin/mocha test.js

Can either install mocha globally, or just edit package.json:
  "scripts": {
    "test": "mocha test.js"
  },

Now can run tests using $ npm test

All tests are passing!

Let's build our initial endpoint... /cities ... starting with our test.

/*
describe('Listing cities on /cities', function() {

  it('Returns a 200 status code', function(done) {
    
    request(app)
      .get('/cities')
      .expect(200, done); // shorthand works the same as above, expect can take done() as its second or third argument
  });
});
*/

$ npm test --> fails, obv, have to set up route...

/* app.js:
app.get('/cities', function(request, response) {
  response.send('OK cities');
})
*/

$ npm test --> passes... write failing test

/* still in /cities describe in test.js:
it('Returns JSON format', function(done) {

    request(app)
      .get('/cities')
      .expect('Content-Type', /json/, done)
  });
*/

$ npm test --> fails, Uncaught Error: expected "Content-Type" matching /json/, got "text/html; charset=utf-8"

/* app.js:
app.get('/cities', function(request, response) {
  response.json('OK cities'); //changed to response.json
})
/*

$ npm test --> passes -- new test that fails...

/* still in cities describe in test.js:
it('Returns initial cities', function(done) {

    request(app)
      .get('/cities')
      .expect(JSON.stringify(['Lotopia', 'Caspiana', 'Indigo']), done);
  })

*/

$ npm test --> fails, Uncaught Error: expected "Content-Type" matching /json/, got "text/html; charset=utf-8"

/* app.js:
app.get('/cities', function(request, response) {
  var cities = ['Lotopia', 'Caspiana', 'Indigo'];
  response.json(cities);
});
/*

$ npm test --> passes -- new test that fails, want to set up to display in html...

/* in test.js root path describe:
 
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
*/ 

first test passes, second fails, so add to app.js:
app.use(express.static('public'));

$ mkdir public

At this point, copy over all files in public folder of [**this exercise's github repository**](https://github.com/codeschool/ExpressSoupToBits).

Express takes care of automatically generating e-tags for you -- caches resources for faster loading in browser
  - E-tags are hashes that are representations of the content of the response body -- smart clients, like jquery, read the value of e-tags, and the next time the browser make a request of a certain url, the browser will send along an e-tag that represents the content it expects, and if that e-tag matches the e-tag of the resource the server generates and sends along, then the browser responds with a 304 -- that the resource was not modified from the earlier version, and the browser won't try to load the newly sent resource, will just re-load the cached version --> saves bandwidth and makes load times much faster

If you want to deploy to heroku at this point, $ heroku create

Need to create a Procfile to instruct heroku how to run our app (just like we're doing, use the bin/www)

$ vim Procfile 
...whose contents are one line: 

web: ./bin/www

On heroku, this will break at this point, because we cannot hard code to a specific port, because heroku assigns ports dynamically, depending on what type of application you're running. To set up so that the app will run from the appropriate port whether running locally or on heroku, we need to change our bin/www file:
/* 
var app = require('./../app');
var port = process.env.PORT || 3000;
app.listen(3000, function() {
  console.log('Listening on port ' + port);
});
*/

So, the jquery and client javascript are already fully formed for dynamically adding to the list, but we need to add tests and routes.

/* Creating new cities, test.js:
describe('Creating new cities', function() {

  it('Returns a 201 status code', function(done) {
    
    request(app)
      .post('/cities/')
      .send('name=Springfield&description=where+the+simpsons+live') // the way we transmit the payload -- submitting form 
      .expect(201, done); // 201 is created successfully status code
  });
});
*/

Add the post route in app.js:
/*
app.post('/cities', function(request, response) {
  response.sendStatus(201);
});
*/ 

Test passes, next test is to return city name after creating:
/* in test.js:
 it('Returns the city name', function(done) {

    request(app)
      .post('/cities')
      .send('name=Springfield&description=where+the+simpsons+live')
      .expect(/springfield/i, done); // return a string with case-insensitive springfield somewhere
  });
*/

Before we do anything else, we need to add body-parser middleware -- express cannot yet parse user-submitted data to JavaScript code.

$ npm install body-parser --save
$ npm shrinkwrap // saving body-parser to production dependencies, so need to shrinkwrap



/* in app.js:
var bodyParser = require('body-parser'); // have to mount it in our application
var urlencode = bodyParser.urlencoded({ extended: false }); // and specify what kind of encoding we're using

* could either employ app.use(bodyParser.urlencoded({ extended: false })) ==> now requests to all of our routes would pass through the urlencode middleware, or we can mount it individually, as we'll do for app.post to '/cities'.

and inside .post function:
app.post('/cities', urlencode, function(request, response) { // have to run request through urlencode
  var newCity = request.body;
  cities[newCity.name] = newCity.description; // now treating cities like an object rather than array, so must change above
  response.status(201).json(newCity.name);
}); 

var cities = {
  'Lotopia':  'lotopia description',
  'Caspiana': 'caspiana description',
  'Indigo': 'indigo description'
};

app.get('/cities', function(request, response) {
  response.json(Object.keys(cities));
});
*/

Now all tests passing -- a request comes in to /cities to create a new city, then goes through urlencode middleware, which reads data submitted by user and turns it into body object on request -- after urlencode is done, the anonymous function that is the app.post route handler will do its thing.

### Adding Redis database behind the server

If redis is not already installed: 
$ brew install redis 

To start redis:
$ redis-server --> gives you the stacked squares image in the command line when running

Have to install package for redis in our app:
$ npm install hiredis redis --save // hiredis is the C library, which is fast
$ npm shrinkwrap

Make sure tests still passing -- yep

Go to app.js and require redis, will replace cities object hard coded in app.js with redis client:

/*
var redis = require('redis');
var client = redis.createClient();

client.hset('cities', 'Lotopia', 'lotopia description'); // see redis readme -- this sets hash in db
client.hset('cities', 'Caspiana', 'caspiana description');
client.hset('cities', 'Indigo', 'indigo description');

[AND delete prev var cities object]

app.get('/cities', function(request, response) {
  client.hkeys('cities', function(error, names) { // call cities from db
    response.json(names);
  });  
});
*/

Now /cities .get is working, have to fix .post:
/*
app.post('/cities', urlencode, function(request, response) {
  var newCity = request.body;
  client.hset('cities', newCity.name, newCity.description, function(error) {
    if (error) throw error;
    response.status(201).json(newCity.name);
  })
});
*/

#### Setting up separate databases for testing and development environments
**You don't need to do this if you set up package.json script section as above**

in app.js: 
client.select((process.env.NODE_ENV || 'development').length); // tells redis which database to use -- takes an integer, defaults to 0 -- NODE_ENV will either be "test" or "development", which have different lengths, so database will change accordingly. If NODE_ENV isn't explicitly set, will default to development database.

then would have to change command to run tests so test data don't persist in dev db -- e.g. were using $ /node-modules/mocha/bin/mocha -w app.js test.js

would now be: $ NODE_ENV=test /node-modules/mocha/bin/mocha -w app.js test.js

Change package.json:
"scripts": {
  "test": "NODE_ENV=test mocha -w app.js test.js"
},

**Set up test to flush database before each test run, otherwise test data persists in database.**

test.js:
/*
var redis = require('redis');
var client = redis.createClient();
client.select('test'.length);
client.flushdb();

[AND now that db is always empty when you start your tests, have to set the get /cities response to an empty array]

it('Returns initial cities', function(done) {

    request(app)
      .get('/JSON.stringify([]), done);cities')
      .expect(
  });
*/

Now all tests passing and separate test and dev databases established. When you add city through the website form now and kill server and restart, the data is persisting!

Now you want to make sure that heroku's configured for production so that there will be a new database ('production'.length).

$ heroku config:add NODE_ENV=production

Also will have to install redis on heroku for production database:
$ heroku addons:add redistogo
[redis to go reference](https://devcenter.heroku.com/articles/redistogo)

add the following to app.js:
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

Now production database is set up, so if you deploy to heroku, everything works correctly. If you run $ heroku restart (shut down and re-spin up the dynos), any data you've submitted persists. But at this point we can submit cities without any data, and we cannot yet delete cities. So that's next:

** if running into problems with heroku, especially application error, run $ heroku logs --tail **

/* in test.js set up delete tests:
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
*/

/* And set up app.js to delete:
app.delete('/cities/:name', function(request, response) {
  client.hdel('cities', request.params.name, function(error) { // redis (and node-redis) hash delete command
    if (error) throw error;
    response.sendStatus(204);
  });
});
*/

Now tests passing and delete function is working as expected. We need to add some validations to prevent the ability to submit empty data.

/* in creating cities describe in test.js:
it('Validates city name and description', function(done) {

    request(app)
      .post('/cities')
      .send('name=&description=') // try to send empty name and description
      .expect(400, done); // 400 is a bad request
  });
});
*/
Test fails: Error: expected 400 "Bad Request", got 201 "Created"

/* And set up validations in app.js:
  var newCity = request.body;
  if (!newCity.name || !newCity.description) {
    response.sendStatus(400);
    return false;
  }
*/

### Adding templating library EJS

First, we'll write a test for it:
/* in test.js:
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
});
*/

/* in app.js create show route:
app.get('/cities/:name', function(request, response) {
  response.render('show.ejs'); // doesn't know what this is yet, have to manually install ejs
  client.hget('cities', request.params.name, function(error) {
    if (error) throw error;
    response.sendStatus(200);
  });
});

Install ejs:
$ npm install ejs --save
Shrinkwrap
$ npm shrinkwrap

You don't need to require ejs in your app.js in order for it to work, just having it installed and required in package.json dependencies should be sufficient.

In order to get the tests to pass, we need to set up a directory in our app called views and create a file called show.ejs:

$ mkdir views // this is the default folder that ejs looks for when you render a specific template
$ vim views/show.ejs (or touch)

Put something in that file ('hey!' or whatevs).

Add new test to check that show route .get returns city-specific info:
/* test.js:
  it('Returns information for given city', function(done) {
    request(app)
      .get('/cities/Banana')
      .expect(/tasty/, done);
  });
*/

Test fails: Error: expected body 'hey!' to match /tasty/

/* 
app.get('/cities/:name', function(request, response) {
  client.hget('cities', request.params.name, function(error, description) {
    response.render('show.ejs', { city: { name: request.params.name, description: description } } ); /* render function's first argument is template, second argument is the data that we want to pass through to the template */
    // if (error) throw error;
    // response.sendStatus(200);
  });
});
*/

Set up show.ejs file (can spice it up with a little html, too, no pressure):
<%= city.name %>
<%= city.description %>

Now everything is working properly, tests passing.

Lastly, we'll refactor our routes to make them a module that app.js can require.

/* app.js becomes:
[Pull all route-related code out and put it into routes/cities.js]

var express = require('express');
var app = express();

app.use(express.static('public'));

var cities = require('./routes/cities');
app.use('/cities', cities);

module.exports = app; 
*/

/* in routes/cities.js:
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

router.route('/') // implied route /cities because this is mounted on /cities in app.js's app.use('/cities', cities); 
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

*/

In heroku, if you need to alter the production database (e.g. in video, they'd added an empty city, no name or description prior to adding validations, but couldn't delete the empty city because the client.hdel command requires request.params.name, which is an empty string), can log in to heroku dashboard, select the appropriate app, click on Redis To Go and check connection stream (which is a really long string of random numbers and letters). To flush database, use this command:

$ redis-cli -h dab.redistogo.com -p -9252 -a 22mn236l2jj62456n2456 flushall
==> responds 'OK'

Finis. To learn more, can check the [express website](http://expressjs.com) for source code/docs.

























