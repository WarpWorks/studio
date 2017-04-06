const RoutesInfo = require('@quoin/expressjs-routes-info');

const pageRoutesInfo = require('./page/routes');
const apiRoutesInfo = require('./api/routes');

module.exports = (baseUrl) => {
    const routesInfo = new RoutesInfo('/', baseUrl);

    routesInfo.use(pageRoutesInfo('/', baseUrl));
    routesInfo.use(apiRoutesInfo('/api', baseUrl));

    return routesInfo;
};
