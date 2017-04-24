//
// Set up Express configuration
//

var express = require('express');
var hbs = require('hbs');
var hbsutils = require('hbs-utils')(hbs);
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

const routes = require('./routes');

const processCwd = path.dirname(require.resolve('./../package.json'));

module.exports = (baseUrl) => {
    const app = express();

    // view engine setup
    app.set('views', path.join(processCwd, 'views'));
    app.set('view engine', 'hbs');
    app.set('w2:baseUrl', baseUrl === '/' ? '' : baseUrl);

    app.use(favicon(path.join(processCwd, 'public', 'images', 'favicon.ico')));
    app.use(bodyParser.json({limit: '10mb'}));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());

    // Public/static
    app.use(express.static(path.join(processCwd, 'public')));
    app.use(express.static(path.join(processCwd, 'server', 'generated')));

    // Deal with Express / Handlebar Partials:
    var partialsDir = path.join(processCwd, 'views');
    // hbs.registerPartials(partialsDir);
    hbsutils.registerWatchedPartials(partialsDir);

    app.use(routes(baseUrl).router);

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

    return app;
};
