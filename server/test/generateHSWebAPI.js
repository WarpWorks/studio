const path = require('path');
console.log("Generating WarpWorks WebAPI:");
var fn = path.join(process.cwd(), 'lib', 'WarpWorks.js');
var hs = require(fn);

console.log("Reading SMN file...");
var smn = hs.readFile(process.cwd()+"/mda/smnModels/WarpWorks.smn");
console.log("Creating WarpWorks model...");
var domain = hs.createModelElementsFromSMN(smn);
// console.log (domain.toString());
// console.log (JSON.stringify(domain.toJSON(), null, 2));

console.log("Applying template...");
var t = hs.applyTemplateFile(process.cwd()+'/mda/templates/WarpWorks_WebAPI.hst', [domain]);
