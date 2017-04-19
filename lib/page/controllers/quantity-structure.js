const RoutesInfo = require('@quoin/expressjs-routes-info');

const utils = require('./../../utils');

module.exports = (req, res) => {
    utils.debugReq(module, req);
    const domain = req.params.domain;

    const resource = utils.createResource(req, {title: 'Quantity Structure'});
    resource.link('W2domain', RoutesInfo.expand('w2:domain', {domain}));

    res.format({
        html() {
            utils.basicRender('quantityStructure', resource, req, res);
        },
        [utils.HAL_CONTENT_TYPE]: () => {
            utils.sendHal(req, res, resource);
        }
    });
};
