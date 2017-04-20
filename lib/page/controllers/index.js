const basic = require('./basic');
const home = require('./home');

const domain = basic.bind(null, 'domain', "Domain Details");
const entityGraph = basic.bind(null, 'entityGraph', "Entity Graph");
const marketplace = basic.bind(null, 'marketplace', "Marketplace");
const quantityStructure = basic.bind(null, 'quantityStructure', "Quantity Structure");
const pageView = basic.bind(null, 'pageView', "Page View");
const tableView = basic.bind(null, 'tableView', "Table View");
const error = basic.bind(null, 'error', "Error");

module.exports = {
    domain,
    error,
    home,
    entityGraph,
    marketplace,
    pageView,
    quantityStructure,
    tableView
};
