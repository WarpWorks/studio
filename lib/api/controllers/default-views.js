const debug = require('debug')('HS:apiRoutes:defaultViews');

const hs = require('./../../headstart');

function generate(req, res) {
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
}

function create(req, res) {
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
}

module.exports = {
    create,
    generate
};
