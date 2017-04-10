const _ = require('lodash');
const RoutesInfo = require('@quoin/expressjs-routes-info');

const utils = require('./../../utils');

module.exports = (req, res) => {
    utils.debugReq(module, req);

    res.format({
        html() {
            const resource = utils.createResource(req, {title: 'Domain Details'});
            utils.basicRender('domain', resource, req, res);
        },

        [utils.HAL_CONTENT_TYPE]: () => {
            const domain = req.params.domain;
            const resource = utils.createResource(req, {domain});
            resource.link('HSdomain', RoutesInfo.expand('hs:domain', {domain}));
            utils.sendHal(req, res, resource);
        }
    });
};
