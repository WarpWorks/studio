// **********************************************************
// Test
// **********************************************************

 writeFile = function (fn, data) {
 var fs = require('fs');
 fn = "./../generated/"+fn;
 fs.writeFile(fn, data, function (err) {
 if (err) return console.log("*** Error: " + err);
 console.log("New file generated: '" + fn + "'");
 });
 }

 readFile = function (fn) {
 fs = require('fs');
 var txt = fs.readFileSync(fn, 'utf8');
 return txt;
 }


 var hs = get_HeadStart();
 var domain =  hs.addNew_Domain("MyShop", "Test Domain");

 var customerEntity = domain.addNew_Entity("Customer", "");
 customerEntity.addNew_BasicProperty("DoB", "").propertyType = "date";
 customerEntity.addNew_BasicProperty("FirstName", "").propertyType = "string";
 customerEntity.addNew_BasicProperty("LastName", "").propertyType = "string";

 var productEntity = domain.addNew_Entity("Product", "");
 productEntity.addNew_BasicProperty("productID", "").propertyType = "string";
 productEntity.addNew_BasicProperty("stock", "").propertyType = "number";
 productEntity.addNew_BasicProperty("isOnSale", "").propertyType = "boolean";

 var orderEntity = domain.addNew_Entity("Order", "");
 orderEntity.addNew_BasicProperty("quantity", "").propertyType = "number";
 var paymentEnum = orderEntity.addNew_Enumeration("payment");
 paymentEnum.addNew_Literal("PayPal", "");
 paymentEnum.addNew_Literal("CreditCard", "");

 var customer2order = customerEntity.addNew_Relationship("myOrders", "");
 customer2order.setTargetEntity(orderEntity);
 customer2order.isAggregation = true;
 customer2order.targetMax = '*';

 var order2product = orderEntity.addNew_Relationship("orderProduct", "");
 customer2order.setTargetEntity(productEntity);
 customer2order.isAggregation = false;
 customer2order.targetMax = '*';

 var hsJson = domain.toJSON();
 writeFile ("HeadStartWeb.jsn", JSON.stringify(hsJson, null, 2));

 var myFile = readFile ("HeadStartServer.jsn");
 hsJson = JSON.parse(myFile);

 var domainCopy = get_Domain_fromJSON (hsJson);
 console.log(JSON.stringify(domainCopy.toJSON(), null, 2));
 