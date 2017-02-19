var hs = require ('./../src/HeadStart/HeadStart.js').HeadStart;

var smn = hs.readFile("./../smn/MyShop.smn");
var myShopDomain = hs.createModelElementsFromSMN(smn);

// Create Default Views
myShopDomain.createNewDefaultViews();

// Add other views
var v1= myShopDomain.getEntities()[0].addNewPageView("MyView", "A nice View");
var p1 = v1.addNewPanel("Panel_1", "Test 1");
p1.addNewSeparatorPanelItem();
p1.addNewSeparatorPanelItem();

console.log(myShopDomain.toString());
console.log("---------------------");

var t = hs.applyTemplateFile('./../templates/DefaultViews.hst', [myShopDomain]);
