//
// Test for Model API
//

var hs = require('./../src/HeadStart/HeadStart.js').HeadStart;

// Customer Domain
var customerDomain = hs.createNewDomain("CustomerData", "Customer entities, including contact details");

// Customer Entity + Properties
var customer = customerDomain.addNewEntity("Customer", "The core customer entity");
var fn = customer.addNewBasicProperty("FirstName", "First name of customer", hs.BasicTypes.String);
fn.constraints = "$.len > 3";
fn.examples = "Joe, Bob, Billy";
var ln = customer.addNewBasicProperty("LastName", "Last or family name of customer", hs.BasicTypes.String);
ln.constraints = "$.len > 3";
ln.examples = "Doe, Smith, Thornton";
var dob = customer.addNewBasicProperty("DoB", "Date of birth", hs.BasicTypes.Date);
dob.constraints = "$ < today";
dob.examples = "10.12.1970, 1.2.1990, 2.3.2000";

// Add "Customer Type" enum
var customerType = customer.addNewEnum("CustomerType", "Private or Company", hs.ValidEnumSelections.One);
customerType.addNewLiteral("Private", "Consumer customer");
customerType.addNewLiteral("Company", "Corporate customer");

// Address Entity
var address = customerDomain.addNewEntity("Address", "Address data for customer");
address.namePlural = "Addresses";
address.addNewBasicProperty("Street", "Street name + house number", hs.BasicTypes.String);
address.addNewBasicProperty("ZIP", "ZIP Code", hs.BasicTypes.String);

// Aggregation relationship for Address:
var customer2address = customer.addNewRelationship(address, true);
customer2address.sourceRole = "Customer";
customer2address.targetRole = "Addresses";
customer2address.targetMin = "0";
customer2address.targetMax = "10";
customer2address.targetAverage = "5";

var pa = address.getAllParentAggregations();

// Add "Country" enum
var country = address.addNewEnum("Country", "List of currently supported countries", hs.ValidEnumSelections.ZeroMany);
country.addNewLiteral("Germany", "'schland!");
country.addNewLiteral("USA", "U.S.A.!");

// Payment Method Entities
var paymentMeth = customerDomain.addNewEntity(
    "PaymentMethod",
    "Abstract class for different payment methods");
paymentMeth.isAbstract = true;
var cc = customerDomain.addNewEntity(
    "CreditCard",
    "All data needed to process different credit card payments",
    paymentMeth);
cc.addNewBasicProperty("Name", "Name on Billing Address", hs.BasicTypes.String);
cc.addNewBasicProperty("Number", "Number on front side", hs.BasicTypes.String);
cc.addNewBasicProperty("Month", "Valid until", hs.BasicTypes.String);
cc.addNewBasicProperty("Year", "Valid until", hs.BasicTypes.String);
cc.addNewBasicProperty("SecurityCode", "3 digit code on backside", hs.BasicTypes.String);

var ppal = customerDomain.addNewEntity(
    "Paypal", "All data needed to process paypal payments", paymentMeth);
ppal.addNewBasicProperty("eMail", "Your eMail used for paypal", hs.BasicTypes.String);

// Aggregation relationship for Address:
var customer2payment = customer.addNewRelationship(paymentMeth, true);
customer2payment.sourceRole = "Customer";
customer2payment.targetRole = "Payment Methods";
customer2payment.targetMin = "1";
customer2payment.targetMax = "3";
customer2payment.targetAverage = "2";

//
// Views for Customer Domain
//

var myCustomerPageView = customer.addNewPageView("MyView", "A View for Customer");
var p1 = myCustomerPageView.addNewPanel("Panel_1", "Basic Object Attributes");
p1.addNewBasicPropertyPanelItem("BasicPropertyPanelItem1_FirstName", "P1", fn);
p1.addNewBasicPropertyPanelItem("BasicPropertyPanelItem2_LastName", "P1", ln);
p1.addNewSeparatorPanelItem();
p1.addNewEnumPanelItem("EnumPanelItem_CustomerType", "...", customerType);
var p2 = myCustomerPageView.addNewPanel("Panel_2", "Relationship");
p2.addNewRelationshipPanelItem("RelationshipPanelItem1_Address", "...", customer2address);

var myCustomerTableView = customer.addNewTableView("TableView1_Customer", "...");
myCustomerTableView.addNewTableItem("TableItem1_LastName", "...", ln);
myCustomerTableView.addNewTableItem("TableItem2_FirstName", "...", fn);
myCustomerTableView.addNewTableItem("TableItem3_DoB", "...", dob);

//
// Order Data Domain
//
var orderDomain = hs.createNewDomain("OrderData", "All entities related to orders; Notice: No rootEntity instances!");
var order = orderDomain.addNewEntity("Order", "Customer order with potentially multiple items");
var orderItem = orderDomain.addNewEntity("OrderItem", "Individual Item of customer order");
var date = order.addNewBasicProperty("Date", "Date of Order Confirmation by Customer", hs.BasicTypes.Date);
date.constraints = "today";
date.examples = "10.12.1970";

// Views:
var myOrderTableView = order.addNewTableView("TableView2_Order", "...");
myOrderTableView.addNewTableItem("TableItem1_Date", "...", date);
var myOrderItemTableView = orderItem.addNewTableView("TableView3_OrderItem", "...");

// Create aggregation relationship for OrderItem:
var order2orderItem = order.addNewRelationship(orderItem, true);
order2orderItem.sourceRole = "Order";
order2orderItem.targetRole = "OrderItems";
order2orderItem.targetMin = "1";
order2orderItem.targetMax = "25";
order2orderItem.targetAverage = "10";

// Create associations:
var order2address = order.addNewRelationship(address, false);

//
// Cross-Domain Relationship
//

// Aggregation relationship for Order:
var customer2order = customer.addNewRelationship(order, true);
customer2order.sourceRole = "Customer";
customer2order.targetRole = "Orders";
customer2order.targetMin = "0";
customer2order.targetMax = "100";
customer2order.targetAverage = "5";

//
// Create new default views
//

customerDomain.createNewDefaultViews();
orderDomain.createNewDefaultViews();

//
// Write HTML for Domains to file
//

hs.applyTemplateFile('./../templates/BasicViews.hst', [customerDomain, orderDomain]);

//
// Print Domain Overview
//

// console.log(hs.toString());

