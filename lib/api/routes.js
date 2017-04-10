const RoutesInfo = require('@quoin/expressjs-routes-info');

const controllers = require('./controllers');

module.exports = (subPath, baseUrl) => {
    const routesInfo = new RoutesInfo(subPath, baseUrl);

    routesInfo.route('hs:domains', '/domains')
        .get(controllers.domain.list);

    routesInfo.route('hs:domain', '/domains/:domain')
        .get(controllers.domain.get)
        .put(controllers.domain.put);

    routesInfo.route('hs:smn-examples', '/smnExamples')
        .get(controllers.smnExamples);

    routesInfo.route('hs:generate-default-views', '/generateDefaultViews')
        .post(controllers.defaultViews.generate);

    routesInfo.route('hs:create-default-views', '/createDefaultViews')
        .post(controllers.defaultViews.create);

    // TBD: Test Data Mgmt should be moved into a separate package, since it is generator-specific
    routesInfo.route('hs:generate-test-data', '/generateTestData')
        .post(controllers.testData.generate);

    routesInfo.route('hs:remove-test-data', '/removeTestData')
        .post(controllers.testData.remove);

    // TODO: Convert to POST /domain with a type=SMN.
    routesInfo.route('hs:create-domain-from-smn', '/createDomainFromSMN')
        .post(controllers.domain.fromSMN);

    return routesInfo;
};
