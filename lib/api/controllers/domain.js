const RoutesInfo = require('@quoin/expressjs-routes-info');
const debug = require('debug')('HS:apiRoutes:domain');

const hs = require('./../../headstart');
const utils = require('./../../utils');

function get(req, res) {
    utils.debugReq(module, req);
    const result = {};

    try {
        result.domain = hs.getDomainByName(req.params.domain);
        result.success = true;
    } catch (err) {
        console.log(err);
        result.err = `Invalid domain name: ${req.params.domain}`;
        result.success = false;
    }

    const resource = utils.createResource(req, result);
    resource.link('entityGraph', RoutesInfo.expand('hs:entity-graph'));
    utils.sendHal(req, res, resource);
}

function list(req, res) {
    utils.debugReq(module, req);

    const resource = utils.createResource(req);

    try {
        const domains = hs.domainFiles();
        domains.forEach((domain) => {
            const domainResource = utils.createResource(RoutesInfo.expand('hs:page-domain', {domain: domain.name}), domain);
            resource.embed('domain', domainResource);
        });
        resource.success = true;
    } catch (err) {
        console.log("*** " + err);
        resource.success = false;
        resource.error = err.toString();
    }

    utils.sendHal(req, res, resource);
}

function put(req, res) {
    utils.debugReq(module, req);
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainData = req.body.domainData;
        var domainName = req.body.domainName;
        try {
            debug("Creating domain: " + domainName);
            var domain = hs.createDomainFromJSONString(domainData);
            if (domainName !== domain.name) {
                throw new Error("Domain name does not match file name: " + domainName + " != " + domain.name);
            }

            debug("Saving: " + domainName);
            domain.save(hs);

            debug("Validating: " + domainName);
            var vRes = domain.validateModel();
            if (vRes) {
                response.warnings = true;
                response.status = vRes;
            }
            response.success = true;
        } catch (err) {
            console.log("Error Saving Domain: " + err);
            debug(err.stack);
            response.success = false;
            response.error = err.toString();
        }
        res.send(response);
    } else {
        res.redirect(303, '/error');
    }
}

function fromSMN(req, res) {
    debug("Post-Request '/api/createDomainFromSMN'"); // TBD - change name to "domain/createFromSMN"
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var smnValue = req.body.value;
        try {
            var domain = hs.createModelElementsFromSMN(smnValue);
            domain.createNewDefaultViews(hs);
            domain.save(hs);
            response.newDomain = domain.name;
            response.success = true;
            debug("Created new Domain from SMN: " + domain.name);
        } catch (err) {
            console.log("Error creating Domain from SMN: " + err);
            console.log(err.stack);
            response.success = false;
            response.error = err.toString();
        }
        res.send(response);
    } else {
        res.redirect(303, '/error');
    }
}

module.exports = {
    fromSMN,
    get,
    list,
    put
};
