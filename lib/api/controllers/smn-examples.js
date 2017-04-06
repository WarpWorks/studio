const debug = require('debug')('HS:apiRoutes:smnExamples');
const path = require('path');

const hs = require('./../../headstart');

module.exports = (req, res) => {
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
};
