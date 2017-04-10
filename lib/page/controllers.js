const _ = require('lodash');
const RoutesInfo = require('@quoin/expressjs-routes-info');

const utils = require('./../utils');

function home(req, res) {
    res.format({
        'html': function() {
            const resource = utils.createResource(req, {title: 'HeadStart'});

            resource.link('newDomain', RoutesInfo.expand('hs:page-domain', {domain: 'New_Domain'}));
            resource.link('marketPlace', RoutesInfo.expand('hs:market-place'));

            utils.basicRender('home', resource, req, res);
        },

        [utils.HAL_CONTENT_TYPE]: function() {
            utils.debugReq(module, req);
            const resource = utils.createResource(req);

            _.map(RoutesInfo.all(), (value, key) => value)
                .filter((route) => route.name.startsWith('hs:'))
                .forEach((route) => {
                    resource.link(route.name, {
                        href: route.pathname,
                        templated: (route.pathname.indexOf('{') !== -1)
                    });
                });

            utils.sendHal(req, res, resource);
        }
    });
}

function domain(req, res) {
    const resource = utils.createResource(req, {title: 'Domain Details'});
    resource.link('HSdomain', RoutesInfo.expand('hs:domain', {domain: req.params.domain}));

    utils.basicRender('domain', resource, req, res);
}

const pageView = utils.basicRender.bind(null, 'pageView', { title: 'Page View' });
const entityGraph = utils.basicRender.bind(null, 'entityGraph', { title: 'Entity Graph' });
const quantityStructure = utils.basicRender.bind(null, 'quantityStructure', { title: 'Quantity Structure' });
const marketplace = utils.basicRender.bind(null, 'marketplace', { title: 'Marketplace' });
const error = utils.basicRender.bind(null, 'error', { title: 'Error' });

function app(req, res) {
    console.log("Getting /app/:" + req.params.app);
    utils.basicRender('app' + req.params.app, { title: 'test', layout: '_appLayout' }, req, res);
}

module.exports = {
    home,
    domain,
    pageView,
    entityGraph,
    quantityStructure,
    marketplace,
    app,
    error
};
