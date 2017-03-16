const apiRouter = require('express').Router();
const path = require('path');

const hs = require('./../../lib/headstart');

const debug = require('debug')('HS:apiRoutes');

apiRouter.get('/domain/:domain', function(req, res, next) {
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
});

apiRouter.get('/smnExamples', function(req, res, next) {
    debug("Get-Request for '/api/smnExamples'!");
    var result = {
        success: true
    };
    try {
        var files = hs.readDir('smnDemos');

        result.smnExamples = files.map((fn) => {
            const templateData = hs.readFile(fn, 'utf8');
            const name = path.basename(fn, '.smn');
            return {
                name,
                template: templateData
            };
        });
    } catch (err) {
        console.log("*** " + err);
        result.success = false;
        result.error = err.toString();
    }

    res.send(result);
});

apiRouter.get('/availableDomains', function(req, res, next) {
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
});

apiRouter.post('/saveDomain', function(req, res, next) {
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
});

apiRouter.post('/generateDefaultViews', function(req, res, next) {
    debug("Post-Request '/api/generateDefaultViews'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            //
            // Generate default views:
            //
            var domain = hs.getDomainByName(domainName);

            // Apply all available template files:
            var files = hs.readDir('templates');
            files.forEach(function(fn) {
                hs.applyTemplateFile(fn, [domain]);
            });

            debug("Generated new default views for " + domainName);
            response.success = true;
        } catch (err) {
            console.log("Error while generating default view: " + err);
            console.log(err.stack);
            response.success = false;
            response.error = err.toString();
        }
        res.send(response);
    } else {
        res.redirect(303, '/error');
    }
});

apiRouter.post('/createDefaultViews', function(req, res, next) {
    debug("Post-Request '/api/createDefaultViews'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {
            success: true
        };
        var domainName = req.body.domainName;
        try {
            //
            // Generate default views:
            //
            var domain = hs.getDomainByName(domainName);

            // Create new default views - TBD: Remove old ones? Persist new ones?
            domain.createNewDefaultViews(hs);
            domain.save(hs);

            debug("Created new default views for " + domainName);
        } catch (err) {
            console.log("Error while creating default view: " + err);
            response.success = false;
            response.error = err.toString();
        }
        res.send(response);
    } else {
        res.redirect(303, '/error');
    }
});

// TBD: Test Data Mgmt should be moved into a separate package, since it is generator-specific

apiRouter.post('/generateTestData', function(req, res, next) {
    debug("Post-Request '/api/generateTestData'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            const domain = hs.getDomainByName(domainName);
            domain.createTestDataForEntity(domain.getRootInstance(), null);
            debug("Generated test data for " + domainName);
            response.success = true;
        } catch (err) {
            console.log("Error while creating default view: " + err);
            response.success = false;
            response.error = err.toString();
        }
        res.send(response);
    } else {
        res.redirect(303, '/error');
    }
});

apiRouter.post('/removeTestData', function(req, res, next) {
    debug("Post-Request '/api/generateDefaultViews'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            hs.removeAllDataFromDB(domainName); // Remove test data!
            response.success = true;
        } catch (err) {
            console.log("Error while dropping test data: " + err);
            response.success = false;
            response.error = err.toString();
        }
        res.send(response);
    } else {
        res.redirect(303, '/error');
    }
});

apiRouter.post('/createDomainFromSMN', function(req, res, next) {
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
});

module.exports = apiRouter;
