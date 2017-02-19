var hs = require ('./../src/HeadStart/HeadStart.js').HeadStart;

var smn = hs.readFile("./../smnModels/HeadStart.smn");
var domain = hs.createModelElementsFromSMN(smn);
//console.log (domain.toString());
//console.log (JSON.stringify(domain.toJSON(), null, 2));

var t = hs.applyTemplateFile('./../templates/HeadStart_WebAPI.hst', [domain]);
