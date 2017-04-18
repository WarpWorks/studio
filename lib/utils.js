const debug = require('debug')('Warp:Studio:utils');
const hal = require('hal');
const path = require('path');
const RoutesInfo = require('@quoin/expressjs-routes-info');

const BASE_PATH = path.dirname(require.resolve('./../package.json'));
const HAL_CONTENT_TYPE = 'application/hal+json';

function basicRender(name, data, req, res) {
    const path = require.resolve(`./../views/${name}.hbs`);
    const layout = require.resolve(`./../views/${data.layout || 'layout'}.hbs`);
    debug(`basicRender(): path=${path}`);
    debug(`basicRender(): layout=${layout}`);

    const resource = (data instanceof hal.Resource) ? data : createResource(req, data);
    resource.baseUrl = req.app.get('hs:baseUrl');

    // Common for all pages (layout)
    resource.link('home', RoutesInfo.expand('hs:home'));
    resource.link('search', RoutesInfo.expand('hs:search'));

    debug(`basicRender(): resource=`, resource);

    res.render(name, resource);
}

function renderError(data, req, res) {
    basicRender('error', data, req, res);
}

function debugReq(m, req) {
    const pathname = path.relative(BASE_PATH, m.filename);
    debug(`(${pathname}) Request: ${req.method} ${req.originalUrl} (${req.headers.accept})`);
}

// ***************************************************************************
//      HAL stuff
// ***************************************************************************

function createResource(reqOrPath, data) {
    if (typeof reqOrPath === 'string') {
        return new hal.Resource(data, reqOrPath || null);
    }
    return new hal.Resource(data, (reqOrPath && reqOrPath.originalUrl) || null);
}

function sendHal(req, res, resource, status) {
    res.status(status || 200)
        .header('Content-Type', HAL_CONTENT_TYPE)
        .json(resource);
}

module.exports = {
    basicRender,
    createResource,
    debugReq,
    HAL_CONTENT_TYPE,
    renderError,
    sendHal
};
