var hs = require('./../src/WarpWorks/WarpWorks.js').WarpWorks;

var smn = hs.readFile("./../smn/MyShop.smn");
var domain = hs.createModelElementsFromSMN(smn);
// console.log (domain.toString());
// console.log (JSON.stringify(domain.toJSON(), null, 2));

var t = hs.applyTemplateFile('./../templates/BasicSMN.hst', [domain]);
