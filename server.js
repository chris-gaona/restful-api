'use strict';
// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var Bear   = require('./app/models/user'); // get our mongoose model

// =======================
// configuration =========
// =======================

var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database, function(err) { // connect to database
  if (err) {
    console.log('Failed connecting to Mongodb!');
  } else {
    console.log('Successfully connected to Mongodb!');
  }
});
app.set('superSecret', config.secret); // secret variable

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.get('/setup', function(req, res) {

  // create a sample user
  var nick = new Bear({
    name: 'Nick Cerminara',
    password: 'password',
    admin: true
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});

// ROUTES FOR OUR API
// =============================================================================
var apiRoutes = express.Router();              // get an instance of the express Router

// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
  // find the user
  Bear.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {
      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {
        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }
    }
  });
});

// TODO: route middleware to verify a token

apiRoutes.use(function(req, res, next) {
  //do logging
  console.log('Something is happening!');
  next(); //make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
apiRoutes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!' });
});

// more routes for our API will happen here

// on routes that end in /bears
// ----------------------------------------------------
apiRoutes.route('/bears')
  // create a bear (accessed at POST http://localhost:8080/api/bears)
  .post(function(req, res) {
    var bear = new Bear(); // create a new instance of the Bear model
    bear.name = req.body.name; // set the bears name (comes from the request)

    // save the bear and check for errors
    bear.save(function(err) {
      if (err)
        res.send(err);

      res.json({message: 'Bear created!'});
    });
  })

  .get(function(req, res) {
    Bear.find({}, function(err, bears) {
      if (err)
        res.send(err);

      res.json(bears);
    });
  });

// on routes that end in /bears/:bear_id
// ----------------------------------------------------
apiRoutes.route('/bears/:bear_id')

  // get the bear with that id (accessed at GET http://localhost:8080/api/bears/:bear_id)
  .get(function(req, res) {
    Bear.findById(req.params.bear_id, function(err, bear) {
      if (err)
        res.send(err);

      res.json(bear);
    });
  })

  // update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
  .put(function(req, res) {
    // use our bear model to find the bear we want
    Bear.findById(req.params.bear_id, function(err, bear) {
      if (err)
        res.send(err);

      bear.name = req.body.name; // update the bears info

      //save the bear
      bear.save(function(err) {
        if (err)
          res.send(err)

        res.json({message: 'Bear updated!'});
      });
    });
  })

  // delete the bear with this id (accessed at DELETE http://localhost:8080/api/bears/:bear_id)
  .delete(function(req, res) {
    Bear.remove({
      _id: req.params.bear_id
    }, function(err, bears) {
      if (err)
        res.send(err);

      res.json({message: 'Successfully deleted!'});
    });
  });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', apiRoutes);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
