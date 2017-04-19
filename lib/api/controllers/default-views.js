const debug = require('debug')('W2:Studio:apiRoutes:defaultViews');
const warpCore = require('@warp-works/core');

function generate(req, res) {
    debug("Post-Request '/api/generateDefaultViews'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            //
            // Generate default views:
            //
            var domain = warpCore.getDomainByName(domainName);

            // Apply all available template files:
            var files = warpCore.readDir('templates');
            files.forEach(function(fn) {
                warpCore.applyTemplateFile(fn, [domain]);
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
            var domain = warpCore.getDomainByName(domainName);

            // Create new default views - TBD: Remove old ones? Persist new ones?
            domain.createNewDefaultViews(warpCore);
            domain.save(warpCore);

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
