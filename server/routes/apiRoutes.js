var hs = require('./../src/HeadStart.js').HeadStart;
var express = require('express');
var apiRouter = express.Router();
var fs = require('fs');

apiRouter.get('/domain/:domain', function (req, res, next) {
    console.log("Get-Request for '/api/get/domain': " + req.params.domain);
    var fn = hs.getDir("domains") + req.params.domain + '.jsn';
    try {
        var file = hs.readFile(fn);
    }
    catch (err) {
        console.log(err);
        result.success = false;
        result.err = "Invalid file name: " + fn;
        res.send(result);
        return;
    }
    var result = {};
    result.success = true;
    result.domain = JSON.parse(file);
    res.send(result);
});

apiRouter.get('/smnExamples', function (req, res, next) {
    console.log("Get-Request for '/api/smnExamples'!");
    var result = {};
    result.success = true;
    try {
        var dir = hs.getDir("smnDemos");
        var fileNames = [];
        var files = fs.readdirSync(dir);

        result.smnExamples = [];
        files.forEach(function (fn) {
            var templateData = fs.readFileSync(dir+"/"+fn, 'utf8');
            var templateName = fn.split(".smn")[0];
            result.smnExamples.push({name: templateName, template: templateData});
        });
    } catch (err) {
        console.log("*** " + err);
        result.success = false;
        result.error = err.toString();
    }

    res.send(result);
});

apiRouter.get('/availableDomains', function (req, res, next) {
    console.log("Get-Request for '/api/availableDomains'!");
    var result = {};
    result.success = true;
    try {
        var dir = hs.getDir("domains");
        var fileNames = [];
        var files = fs.readdirSync(dir);
    } catch (err) {
        console.log("*** " + err);
        result.success = false;
        result.error = err.toString();
    }

    result.domains = [];
    files.forEach(function (elem) {
        var name = elem.split(".jsn")[0];
        result.domains.push({name: name, desc: "TBD: Description"});
    });
    res.send(result);
});

apiRouter.post('/saveDomain', function (req, res, next) {
    console.log("Post-Request '/api/saveDomain'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainData = req.body.domainData;
        var domainName = req.body.domainName;
        try {
            console.log("Creating domain: " + domainName);
            var domain = hs.createDomainFromJSONString(domainData);
            if (domainName !== domain.name) throw "Domain name does not match file name: "+domainName+" != "+domain.name;

            console.log("Saving: " + domainName);
            domain.save();

            console.log("Validating: " + domainName);
            var vRes = domain.validateModel();
            if (vRes) {
                response.warnings = true;
                response.status = vRes;
            }
            response.success = true;
        } catch (err) {
            response.success = false;
            response.error = err.toString();
            console.log("Error Saving Domain: " + err);
        }
        res.send(response);
    }
    else {
        res.redirect(303, '/error');
    }
});

apiRouter.post('/generateDefaultViews', function (req, res, next) {
    console.log("Post-Request '/api/generateDefaultViews'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            //
            // Generate default views:
            //
            var fn = hs.getDir("domains") + domainName + '.jsn';
            var file = hs.readFile(fn);
            var domain = hs.createDomainFromJSONString(file);

            // Apply all available template files:
            dir = hs.getDir("templates");
            var fileNames = [];
            var files = fs.readdirSync(dir);
            files.forEach(function (fn) {
                hs.applyTemplateFile(hs.getDir("templates") + fn, [domain]);
            });

            console.log("Generated new default views for " + domainName);
            response.success = true;
        } catch (err) {
            response.success = false;
            response.error = err.toString();
            console.log("Error while generating default view: " + err);
        }
        res.send(response);
    }
    else {
        res.redirect(303, '/error');
    }
});

apiRouter.post('/createDefaultViews', function (req, res, next) {
    console.log("Post-Request '/api/createDefaultViews'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            //
            // Generate default views:
            //
            var fn = hs.getDir("domains") + domainName + '.jsn';
            var file = hs.readFile(fn);
            var domain = hs.createDomainFromJSONString(file);

            // Create new default views - TBD: Remove old ones? Persist new ones?
            domain.createNewDefaultViews();
            domain.save();

            console.log("Created new default views for " + domainName);
            response.success = true;
        } catch (err) {
            response.success = false;
            response.error = err.toString();
            console.log("Error while creating default view: " + err);
        }
        res.send(response);
    }
    else {
        res.redirect(303, '/error');
    }
});

// TBD: Test Data Mgmt should be moved into a separate package, since it is generator-specific

apiRouter.post('/generateTestData', function (req, res, next) {
    console.log("Post-Request '/api/generateTestData'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            var fn = hs.getDir("domains") + domainName + '.jsn';
            var file = hs.readFile(fn);
            var domain = hs.createDomainFromJSONString(file);
            domain.createTestDataForEntity(domain.getRootInstance(), null);
            console.log("Generated test data for " + domainName);
            response.success = true;
        } catch (err) {
            response.success = false;
            response.error = err.toString();
            console.log("Error while creating default view: " + err);
        }
        res.send(response);
    }
    else {
        res.redirect(303, '/error');
    }
});

apiRouter.post('/removeTestData', function (req, res, next) {
    console.log("Post-Request '/api/generateDefaultViews'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            hs.removeAllDataFromDB(domainName); // Remove test data!
            response.success = true;
        } catch (err) {
            response.success = false;
            response.error = err.toString();
            console.log("Error while dropping test data: " + err);
        }
        res.send(response);
    }
    else {
        res.redirect(303, '/error');
    }
});

apiRouter.post('/createDomainFromSMN', function (req, res, next) {
    console.log("Post-Request '/api/createDomainFromSMN'"); // TBD - change name to "domain/createFromSMN"
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var smnValue = req.body.value;
        try {
            var domain = hs.createModelElementsFromSMN(smnValue);
            domain.createNewDefaultViews();
            domain.save();
            response.newDomain = domain.name;
            response.success = true;
            console.log("Created new Domain from SMN: " + domain.name);

        } catch (err) {
            response.success = false;
            response.error = err.toString();
            console.log("Error creating Domain from SMN: " + err);
            console.log(err.stack);
        }
        res.send(response);
    }
    else {
        res.redirect(303, '/error');
    }
});

module.exports = apiRouter;
