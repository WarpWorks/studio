const debug = require('debug')('HS:apiRoutes:domain');
const path = require('path');

const hs = require('./../../headstart');

function get(req, res) {
    debug("Get-Request for '/api/get/domain': " + req.params.domain);
    try {
        res.send({
            success: true,
            domain: hs.getDomainByName(req.params.domain)
        });
    } catch (err) {
        console.log(err);
        res.send({
            success: false,
            err: `Invalid domain name: ${req.params.domain}`
        });
    }
}

function list(req, res) {
    debug("Get-Request for '/api/availableDomains'!");
    const result = {
        success: true
    };

    try {
        const files = hs.readDir('domains');

        result.domains = files.map((fn) => {
            const name = path.basename(fn, '.jsn');
            return {
                name,
                desc: "TBD: Description"
            };
        });
    } catch (err) {
        console.log("*** " + err);
        result.success = false;
        result.error = err.toString();
    }

    res.send(result);
}

function post(req, res) {
    debug("Post-Request '/api/saveDomain'");
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
    post
};
