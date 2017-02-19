var express = require('express');
var pageRouter = express.Router();

// ------------------------------------------------------------------
// Routes for HeadStart Server
// ------------------------------------------------------------------

pageRouter.get('/', function(req, res, next) {
  res.render('home', { title: 'HeadStart' });
});

pageRouter.get('/domain/:domain', function(req, res, next) {
  res.render('domain', { title: 'Domain Details' });
});

pageRouter.get('/pageView/:domain', function(req, res, next) {
  res.render('pageView', { title: 'Page View' });
});

pageRouter.get('/entityGraph/:domain', function(req, res, next) {
  res.render('entityGraph', { title: 'Entity Graph' });
});

pageRouter.get('/quantityStructure/:domain', function(req, res, next) {
  res.render('quantityStructure', { title: 'Quantity Structure' });
});

pageRouter.get('/marketplace', function(req, res, next) {
  res.render('marketplace', { title: 'Marketplace' });
});

// ------------------------------------------------------------------
// Routes for generated applications
// ------------------------------------------------------------------

pageRouter.get('/app/:app', function(req, res, next) {
  console.log("Getting /app/:"+req.params.app);
  res.render('app'+req.params.app, { title: 'test', layout: '_appLayout' });
});

module.exports = { 
  router: pageRouter
};
