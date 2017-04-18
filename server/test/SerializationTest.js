//
// Test serialization / deserialization
//

var hs = require('./../src/WarpWorks/WarpWorks.js').WarpWorks;

// Create test model

var smn = hs.readFile("./../smn/CustomerData.smn");
var testDomain = hs.createNewDomain("CustomerData_APITest", "For testing purposes");
hs.createModelElementsFromSMN(testDomain, smn);

console.log(testDomain.toString());
console.log("***");

// Test serialization

var jsonTxt = JSON.stringify(testDomain);
var jsonPretty = JSON.stringify(JSON.parse(jsonTxt), null, 2);
console.log(jsonPretty);
