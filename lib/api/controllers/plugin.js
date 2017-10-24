const debug = require('debug')('W2:Studio:apiRoutes:testData');
const warpCore = require('@warp-works/core');
const utils = require('./../../utils');
const pluginObject = require('./pluginFunction').pluginContainer;


function list(req, res) {
    utils.debugReq(module, req);

    const resource = utils.createResource(req);

    try {
		//TODO Fill with real values from actions
		resource.plugins = [["OpenApi","CreateOpenApi()"],["OpenApi2","CreateOpenApi()"]]
        resource.success = true;
    } catch (err) {
        console.log("*** " + err);
        resource.success = false;
        resource.error = err.toString();
    }

    utils.sendHal(req, res, resource);
}
/**
This function is used to handle the request for a pluginFunction
It reads the properties object and function and then calls this function on this object.
It returns the function specific data to the client.
@param{object} transferObject - Object that is transmitted to the backend. optional
@param{pluginfunction} pluginfunction - Pluginfunction that is called in the backend.
@returns{response}

**/

function pluginFunction(req,res){

	utils.debugReq(module, req);
	if (req.xhr || req.accepts('json') === 'json') {
		let params  = req.body.params;
		let NamePluginFunction = req.body.pluginFunction;
		const resource = utils.createResource(req);
		try {
			resource.functionResult = pluginObject[NamePluginFunction](params);
			
			resource.success = true;
		} catch (err) {
			console.log("*** " + err);
			resource.success = false;
			resource.error = err.toString();
		}
		utils.sendHal(req, res, resource);
	}
	else {
        res.redirect(303, '/error');
    }
	
}



module.exports = {
    list,
	pluginFunction
};
