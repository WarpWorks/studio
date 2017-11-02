const debug = require('debug')('W2:Studio:apiRoutes:testData');
const warpCore = require('@warp-works/core');
const Domain = require('@warp-works/core/lib/models/domain');
const Entity = require('@warp-works/core/lib/models/entity');
var countWrite = 0;

function generate(req, res) {

    debug("Post-Request '/api/generateTestData'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        var response = {};
        var domainName = req.body.domainName;
        try {
            const domain = warpCore.getDomainByName(domainName);
            domain.createBulkDataForEntity(domain.getRootInstance(), null);
			//writeOpenApi(domain);
			
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
	//TODO put this in a separate function


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


	Domain.prototype.createBulkData = function(entityDef, relationship, parentInstanceID, parentBaseClass, numberOfElements,path) {
        // TBD: Change algorithm to  create as many entities as possible with one DB insert
		var domain = this;
		var batchsize = 1000;
		var batches = numberOfElements / batchsize;
		if (batches < 1){
			
			var batch = numberOfElements;
			var batches = 1 ;
		}
		else{
			
			var batch = batchsize;
		}
		
		createTestData(0,batches);
				
		function createTestData(batchrun,batches){
		
		if (batchrun !== batches){
		
		var bulkData = [];

		
		var run = 0;

		
		
		while (run < batch) 
		{ run = run +1;
		path = "/";
		
		if (typeof(relationship) !== 'undefined'){
		var myPath = path + relationship.name + ':' + (batchrun * 1000 + run + 1) + '/';
		}
        if (entityDef.isAbstract) {
            return;
        } // Don't create test instances for abstract entity types!
		
        // Create test document, including embedded entities
        path = parentInstanceID ? myPath : "/";
        var testData = entityDef.createTestDocument(true, myPath);

        if (parentInstanceID) {
            testData.parentID = parentInstanceID;
            testData.parentRelnID = relationship.id;
            testData.parentRelnName = relationship.name;
            testData.parentBaseClassID = parentBaseClass.id;
            testData.parentBaseClassName = parentBaseClass.name;
        } else {
            testData.isRootInstance = true;
            testData.parentID = null;
            testData.parentRelID = null;
            testData.parentBaseClassID = null;
            testData.parentBaseClassName = null;
        }
		bulkData.push(testData) ;
        // TBD: TEST - var ObjectID = require("mongodb").ObjectID;
        // testData._id = new ObjectID().toString();
		}
		insertBulkData(bulkData)
		 
		

		} 
		
    
	function insertBulkData(testData)
	{
            if (testData.length > 0) {
				domain.getWarpWorks().useDB(domain.name, function(db) {
				var collection = db.collection(entityDef.getBaseClass().name);
				collection.insertMany(bulkData, function(mongoErr, mongoRes) {
					if (mongoErr) {
						console.log("Error Bulk test data: " + mongoErr);
						return(false);
					} else {
						var time = new Date;
						
						//start timer at after first insert
						if (countWrite === 0){
							console.log("Started writing entries");
							console.time("1mio");
							console.time("10mio");
							console.time("100mio");
							console.time("1bio");

						}
						
						countWrite = countWrite + 1000;
						switch(countWrite) {
							case (1000000):
								console.log("Finished writing 1Million Entities");
								console.timeEnd("1mio");
								break;
							case (10000000):
								console.log("Finished writing 10 Million Entities");
								console.timeEnd("10mio");
								break;
							case (100000000):
								console.log("Finished writing 100 Million Entities");
								console.timeEnd("100mio");
								break;
							case (1000000000):
								console.log("Finished writing 100 Million Entities");
								console.timeEnd("1bio");
								break; 		
						
						}
								
						createTestData(batchrun+1,batches);
						return(true)
					}
				});
			});

			
			}
			else {
			return(false);
		}
	}

		return;
		}
		
	
}

    Domain.prototype.createBulkDataForEntity = function(entityDef, relationship, parentInstanceID, parentBaseClass, path) {
        // TBD: Change algorithm to  create as many entities as possible with one DB insert

        if (entityDef.isAbstract) {
            return;
        } // Don't create test instances for abstract entity types!

        // Create test document, including embedded entities
        path = parentInstanceID ? path : "/";
        var testData = entityDef.createTestDocument(true, path);

        if (parentInstanceID) {
            testData.parentID = parentInstanceID;
            testData.parentRelnID = relationship.id;
            testData.parentRelnName = relationship.name;
            testData.parentBaseClassID = parentBaseClass.id;
            testData.parentBaseClassName = parentBaseClass.name;
        } else {
            testData.isRootInstance = true;
            testData.parentID = null;
            testData.parentRelID = null;
            testData.parentBaseClassID = null;
            testData.parentBaseClassName = null;
        }
        // TBD: TEST - var ObjectID = require("mongodb").ObjectID;
        // testData._id = new ObjectID().toString();

        var domain = this;
        this.getWarpWorks().useDB(domain.name, function(db) {
            var collection = db.collection(entityDef.getBaseClass().name);
            collection.insertOne(testData, function(mongoErr, mongoRes) {
                if (mongoErr) {
                    console.log("Error creating test data: " + mongoErr);
                } else {
                    var aggs = entityDef.getAggregations();
                    if (aggs) {
                        aggs.forEach(function(rel) {
                            if (!rel.getTargetEntity().isDocument()) {
                                return;
                            }
                            var avg = rel.targetAverage;
                            if (isNaN(avg)) {
                                console.log("WARNING: Incomplete Quantity Model - Average for relationship '" + rel.name + "' not defined! Assuming AVG=1");
                                avg = 1;
                            }

                                domain.createBulkData(rel.getTargetEntity(), rel, mongoRes.ops[0]._id, entityDef.getBaseClass(),(avg-1),path);
								domain.createBulkDataForEntity(rel.getTargetEntity(), rel, mongoRes.ops[0]._id, entityDef.getBaseClass(),(avg-1),path)

						})
					}	
				}
			});
        });
    }	






module.exports = {
    generate,
    remove
};
