console.log("Generating HeadStart WebAPI:");
var hs = require (process.cwd()+'/server/src/HeadStart.js').HeadStart;

console.log("Reading SMN file...");
var smn = hs.readFile(process.cwd()+"/mda/smnModels/HeadStart.smn");
console.log("Creating HeadStart model...");
var domain = hs.createModelElementsFromSMN(smn);
//console.log (domain.toString());
//console.log (JSON.stringify(domain.toJSON(), null, 2));

console.log("Applying template...");
var t = hs.applyTemplateFile(process.cwd()+'/mda/templates/HeadStart_WebAPI.hst', [domain]);
