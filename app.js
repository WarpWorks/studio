//
// Set up Express configuration
//

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var apiRoutes   = require('./server/routes/apiRoutes');
var appApiRoutes   = require('./server/routes/appApiRoutes');
var pageRoutes  = require('./server/routes/pageRoutes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json({limit:'10mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Public/static
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'server/generated')));

// Deal with Express / Handlebar Partials:
var partialsDir = __dirname + '/views';
var hbs = require('hbs');
//hbs.registerPartials(partialsDir);
var hbsutils = require('hbs-utils')(hbs);
hbsutils.registerWatchedPartials(partialsDir);

/*
// Load partials for express
var hs = require ('./server/src/HeadStart/HeadStart.js').HeadStart;
hs.loadGeneratedHBSPartials();
*/

app.use('/', pageRoutes.router);
app.use('/api', apiRoutes);
app.use('/appApi', appApiRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
