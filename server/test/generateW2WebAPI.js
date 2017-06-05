const path = require('path');
console.log("Generating WarpWorks WebAPI:");
const warpCore = require('@warp-works/core');

const ROOT_DIR = path.dirname(require.resolve('./../../package.json'));


console.log("Reading SMN file...");
var smn = warpCore.readFile(require.resolve('@warp-works/core/mda/WarpWorks.smn'));
console.log("Creating WarpWorks model...");
var domain = warpCore.createModelElementsFromSMN(smn);
// console.log (domain.toString());
// console.log (JSON.stringify(domain.toJSON(), null, 2));

console.log("Applying template...");

// TBD - fix problem with target directory!
var t = warpCore.applyTemplateFile(path.join(ROOT_DIR, 'mda', 'templates', 'WarpWorks_WebAPI.hst'), [domain]);
