const RoutesInfo = require('@quoin/expressjs-routes-info');

const controllers = require('./controllers');

module.exports = (subPath, baseUrl) => {
    const routesInfo = new RoutesInfo(subPath, baseUrl);

    // ------------------------------------------------------------------
    // Routes for HeadStart Server
    // ------------------------------------------------------------------

    routesInfo.route('hs:home', '/').get(controllers.home);
    // TODO
    routesInfo.route('hs:search', '/search').get(controllers.home);
    routesInfo.route('hs:page-domain', '/domain/:domain').get(controllers.domain);
    routesInfo.route('hs:page-view', '/pageView/:domain').get(controllers.pageView);
    routesInfo.route('hs:entity-graph', '/entityGraph/:domain').get(controllers.entityGraph);
    routesInfo.route('hs:quantity-structure', '/quantityStructure/:domain').get(controllers.quantityStructure);
    routesInfo.route('hs:market-place', '/marketplace').get(controllers.marketplace);
    routesInfo.route('hs:page-error', '/error').get(controllers.error);

    return routesInfo;
};
