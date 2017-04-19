const RoutesInfo = require('@quoin/expressjs-routes-info');

const controllers = require('./controllers');

module.exports = (subPath, baseUrl) => {
    const routesInfo = new RoutesInfo(subPath, baseUrl);

    // ------------------------------------------------------------------
    // Routes for WarpWorks Server
    // ------------------------------------------------------------------

    routesInfo.route('w2:home', '/').get(controllers.home);
    // TODO
    routesInfo.route('w2:search', '/search').get(controllers.home);
    routesInfo.route('w2:page-domain', '/domain/:domain').get(controllers.domain);
    routesInfo.route('w2:page-view', '/pageView/:domain').get(controllers.pageView);
    routesInfo.route('w2:entity-graph', '/entityGraph/:domain').get(controllers.entityGraph);
    routesInfo.route('w2:quantity-structure', '/quantityStructure/:domain').get(controllers.quantityStructure);
    routesInfo.route('w2:market-place', '/marketplace').get(controllers.marketplace);
    routesInfo.route('w2:page-error', '/error').get(controllers.error);

    return routesInfo;
};
