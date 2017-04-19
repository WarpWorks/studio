const debug = require('debug')('W2:Studio:apiRoutes:testData');
const warpCore = require('@warp-works/core');

function generate(req, res) {
    debug("Post-Request '/api/generateTestData'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            const domain = warpCore.getDomainByName(domainName);
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
}

function remove(req, res) {
    debug("Post-Request '/api/generateDefaultViews'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            warpCore.removeAllDataFromDB(domainName); // Remove test data!
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
}

module.exports = {
    generate,
    remove
};
