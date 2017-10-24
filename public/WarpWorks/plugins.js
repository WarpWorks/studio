// Container for all callable plugin functions

function CreateOpenApi(){
	let domainName = $active.domain.name;
	return callPluginFunction("CreateOpenApi",domainName).then(function(result){

		
		console.log(result.functionResult);
		// on result go to link.
		var getUrl = window.location;
		var baseUrl = getUrl.protocol + "//" + getUrl.host +"/openapi/"+domainName+"/openApi.html";
		window.location = baseUrl;		
	}).catch(function(){
		console.log("Some Error in AJAX call for Plugin")
	});
	

}

/**
This function is used to call any backend plugin function.
It returns a promise for this function call to the backend.
@param{params} transferObject - params that is transmitted to the backend. optional
@param{pluginfunction} pluginfunction - Pluginfunction that is called in the backend.
@returns{promise}

**/
function callPluginFunction(pluginfunction,params){
	return new Promise(function (resolve,reject){
		var xhr = new XMLHttpRequest();
		xhr.onload = function(){
			resolve(JSON.parse(this.responseText));}
		xhr.onerror = reject;
		xhr.open('POST',$active._links.pluginFunction.href);
		xhr.setRequestHeader("Content-type", "application/json");

		xhr.send(JSON.stringify({"pluginFunction":pluginfunction,"params":params}));
	});
}