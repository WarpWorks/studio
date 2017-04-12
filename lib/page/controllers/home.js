const _ = require('lodash');
const RoutesInfo = require('@quoin/expressjs-routes-info');

const utils = require('./../../utils');

module.exports = (req, res) => {
    utils.debugReq(module, req);
    const resource = utils.createResource(req, {title: 'HeadStart'});

    _.map(RoutesInfo.all(), (value, key) => value)
        .filter((route) => route.name.startsWith('hs:'))
        .forEach((route) => {
            resource.link(route.name, {
                href: route.pathname,
                templated: (route.pathname.indexOf('{') !== -1)
            });
        });

    resource.link('newDomain', RoutesInfo.expand('hs:page-domain', {domain: 'New_Domain'}));
    resource.link('marketPlace', RoutesInfo.expand('hs:market-place'));

    res.format({
        html() {
            utils.basicRender('home', resource, req, res);
        },

        [utils.HAL_CONTENT_TYPE]: () => {
            utils.sendHal(req, res, resource);
        }
    });
};
