const RoutesInfo = require('@quoin/expressjs-routes-info');

const utils = require('./../../utils');

module.exports = (req, res) => {
    utils.debugReq(module, req);

    const domain = req.params.domain;

    const resource = utils.createResource(req, {title: 'Entity Graph'});
    resource.link('HSdomain', RoutesInfo.expand('hs:domain', {domain}));

    res.format({
        html() {
            utils.basicRender('entityGraph', resource, req, res);
        },

        [utils.HAL_CONTENT_TYPE]: () => {
            utils.sendHal(req, res, resource);
        }
    });
};
