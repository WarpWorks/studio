const path = require('path');
console.log("Generating WarpWorks WebAPI:");
const warpCore = require('@warp-works/core');

console.log("Reading SMN file...");
var smn = warpCore.readFile(process.cwd()+"/../../mda/smnModels/WarpWorks.smn");
console.log("Creating WarpWorks model...");
var domain = warpCore.createModelElementsFromSMN(smn);
// console.log (domain.toString());
// console.log (JSON.stringify(domain.toJSON(), null, 2));

console.log("Applying template...");

// TBD - fix problem with target directory!
var t = warpCore.applyTemplateFile(process.cwd()+'/../../mda/templates/WarpWorks_WebAPI.hst', [domain]);
