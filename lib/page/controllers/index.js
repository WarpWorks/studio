const utils = require('./../../utils');

const domain = require('./domain');
const entityGraph = require('./entity-graph');
const home = require('./home');
const quantityStructure = require('./quantity-structure');

const pageView = utils.basicRender.bind(null, 'pageView', { title: 'Page View' });
const marketplace = utils.basicRender.bind(null, 'marketplace', { title: 'Marketplace' });
const error = utils.basicRender.bind(null, 'error', { title: 'Error' });

module.exports = {
    home,
    domain,
    pageView,
    entityGraph,
    quantityStructure,
    marketplace,
    error
};
