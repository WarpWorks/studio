const RoutesInfo = require('@quoin/expressjs-routes-info');

const controllers = require('./controllers');

module.exports = (subPath, baseUrl) => {
    const routesInfo = new RoutesInfo(subPath, baseUrl);

    // ------------------------------------------------------------------
    // Routes for HeadStart Server
    // ------------------------------------------------------------------

    routesInfo.route('hs-page-home', '/').get(controllers.home);
    routesInfo.route('hs-page-domain', '/domain/:domain').get(controllers.domain);
    routesInfo.route('hs-page-view', '/pageView/:domain').get(controllers.pageView);
    routesInfo.route('hs-entity-graph', '/entityGraph/:domain').get(controllers.entityGraph);
    routesInfo.route('hs-quantity-structure', '/quantityStructure/:domain').get(controllers.quantityStructure);
    routesInfo.route('hs-market-place', '/marketplace').get(controllers.marketplace);

    // ------------------------------------------------------------------
    // Routes for generated applications
    // ------------------------------------------------------------------

    routesInfo.route('hs-app', '/app/:app').get(controllers.app);

    return routesInfo;
};
