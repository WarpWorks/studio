const warpCore = require('@warp-works/core');

const utils = require('./../../utils');

module.exports = (req, res) => {
    utils.debugReq(module, req);
    var result = {};
    try {
        result.smnExamples = warpCore.smnFiles();
        result.success = true;
    } catch (err) {
        console.log("*** " + err);
        result.success = false;
        result.error = err.toString();
    }

    res.send(result);
};
