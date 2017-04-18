//
// Test SMN
//

var hs = require('./../src/WarpWorks/WarpWorks.js').WarpWorks;

// var smn = hs.readFile("smn/WarpWorks.smn");
var smn = hs.readFile("smn/HelloWorld.smn");
// var smn = hs.readFile("smn/CustomerData.smn");
// var smn = hs.readFile("./../smn/ErrorTests.smn");

var testDomain = hs.createNewDomain("Test_Domain", "For testing purposes");
hs.createModelElementsFromSMN(testDomain, smn);
console.log(testDomain.toString());
