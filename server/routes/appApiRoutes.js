var hs = require('./../src/HeadStart.js').HeadStart;
var express = require('express');
var appApiRouter = express.Router();
var ObjectID = require("mongodb").ObjectID;
var fs = require('fs');

appApiRouter.post('/CRUD', function (req, res, next) {
    console.log("Post-Request '/appApi/CRUD'");
    if (req.xhr || req.accepts('json,html') === 'json') {
        try {
            var response = {};
            var resultList = [];
            var commandList = req.body.commandList;

            // TBD - Hack: Currently only use Command Lists of lenght 1
            if (!commandList || commandList.length != 1) throw "Invalid Command List";
            var currentCommand = commandList[0];

            var domain = currentCommand.domain;
            if (!domain) throw "Error processing CRUD command - no domain specified!";
            var targetType = currentCommand.targetType;
            if (!targetType) throw "Error processing CRUD command - no target type specified!";

            hs.useDB(domain, function (db) {
                var collection = db.collection(targetType);
                console.log("CRUD-Request using DB:"+db.databaseName+", Collection:"+collection.collectionName);

                if (!currentCommand.currentPage) console.log("Warning: currentPage not defined, assuming 0");
                if (!currentCommand.entitiesPerPage) console.log("Warning: entitiesPerPage not defined, assuming 10");
                var currentPage   = currentCommand.currentPage   ? currentCommand.currentPage : 0;
                var entitiesPerPage = currentCommand.entitiesPerPage ? currentCommand.entitiesPerPage : 10;
                var startingAt = entitiesPerPage * currentPage;

                switch (currentCommand.command) {
                    case "GetRootInstance":
                        collection.findOne({isRootInstance: true}, function (mongoErr, mongoRes) {
                            if (mongoRes) {
                                var msg = "Found root instance for " + domain + ", ID=" + mongoRes._id;
                                console.log(msg);
                                resultList.push({
                                    queryType: "GetRootInstance",
                                    queryID: currentCommand.queryID,
                                    rootInstance: mongoRes,
                                    error: false,
                                    status: msg
                                });
                                response.resultList = resultList;
                                response.success = true;
                                res.send(response);
                                return;
                            }
                            else {
                                collection.insertOne({
                                    domainName: domain,
                                    isRootInstance: true,
                                    parentID: null
                                }, function (mongoErr2, mongoRes2) {
                                    if (mongoErr2) {
                                        var msg = "Error creating root instance for " + domain + ": " + mongoErr2;
                                        console.log(msg);
                                        resultList.push({
                                            queryType: "GetRootInstance",
                                            queryID: currentCommand.queryID,
                                            value: null,
                                            error: true,
                                            status: msg
                                        });
                                    }
                                    else {
                                        var msg = "Created new root instance for " + domain + " with ID " + mongoRes2.ops[0]._id;
                                        console.log(msg);
                                        resultList.push({
                                            queryType: "GetRootInstance",
                                            queryID: currentCommand.queryID,
                                            value: mongoRes2.ops[0],
                                            error: false,
                                            status: msg
                                        });
                                    }
                                    response.resultList = resultList;
                                    response.success = true;
                                    res.send(response);
                                    return;
                                });
                            }
                        });
                        return;
                    case "AggregationQuery":
                        if (!currentCommand.parentID || currentCommand.parentID === null)
                            throw "AggregationQuery must include 'parentID'!";
                        var values = [];
                        //skip(startingAt).limit(entitiesPerPage);
                        console.log("parentID: " + currentCommand.parentID);

                        var query = {
                            parentID: ObjectID(currentCommand.parentID),
                            parentRelnName: currentCommand.parentRelnName
                        };
                        var cursor = collection.find(query);
                        cursor.count(function (mongoErr1, count) {
                            cursor.skip(startingAt);
                            cursor.limit(entitiesPerPage);
                            cursor.toArray(function (mongoErr2, arr) {
                                if (arr && !mongoErr1 && !mongoErr2) {
                                    var msg = "Found " + count + " matching entities!";

                                    console.log(msg);
                                    resultList.push({
                                        queryType: "AggregationQuery",
                                        queryID: currentCommand.queryID,
                                        parentID: currentCommand.parentID,
                                        parentType: currentCommand.parentType,
                                        parentRelnName: currentCommand.parentRelnName,
                                        queryResultsCount: count,
                                        result: arr,
                                        error: false,
                                        status: msg
                                    });
                                    response.resultList = resultList;
                                    response.success = true;
                                    res.send(response);
                                } else {
                                    err = true;
                                    msg = "Error while trying to resolve aggregation with TargetType=" + targetType + " in Domain " + domain;
                                }
                                return;
                            });
                            return;
                        });
                        return;
                    case "Create":
                        var value = currentCommand.entities[0]; // TBD: HACK, should work with list
                        if (value._id) throw "Failed to create new entity - new entity data must not contain '_id' field before creation!";
                        if (!value.parentID) throw "Failed to create new entity - parent ID is missing!";
                        value.parentID = ObjectID(value.parentID);
                        collection.insertOne(value, function (err, r) {
                            if (err) {
                                console.log("Error creating new object of type " + value.type + ": " + err);
                            }
                            else {
                                console.log("Created " + value.type + " with ID " + value._id + ": " + r);
                            }
                            response.resultList = resultList;
                            response.success = true;
                            res.send(response);
                            return;
                        });
                        return;
                    case "Update":
                        // TBD - hack: This must process all values in "entities", not only the first element!
                        // Notice - this requires being able to handle *different target types*!!!
                        if (!currentCommand.entities || currentCommand.entities.length !=1) throw "Update: 'entities' must contain exactly one entity, at the moment!";
                        var entity = currentCommand.entities[0];
                        if (!entity._id) throw "Update target is missing '_id' field!";

                        console.log("ID1:"+entity._id);
                        var idQuery = {"_id": new ObjectID(entity._id)};
                        delete entity._id;
                        console.log("Collection: "+collection.collectionName);

                        collection.update(idQuery, {$set: entity}, function (err, r) {
                            if (err) {
                                console.log("Error updating object of type " + entity.targetType + ": " + err);
                            }
                            else {
                                console.log("Updated " + entity.targetType + " with ID " + idQuery._id.toString() + ": " + r);
                            }
                            response.resultList = resultList;
                            response.success = true;
                            res.send(response);
                            return;
                        });
                        return;
                    case "FindByID":
                        var id = currentCommand.targetID;
                        if (!id) throw "Find-Query must contain targetID!";
                        collection.findOne({_id: ObjectID(id)}, function (mongoErr, mongoRes) {
                            var msg = "";
                            var err = false;
                            var result = null;
                            if (mongoRes) {
                                msg = "Found instance for ID=" + mongoRes._id + " in Domain " + domain;
                                result = mongoRes;
                            }
                            else {
                                err = true;
                                msg = "No matching object for ID=" + id;
                            }
                            resultList.push({
                                queryType: "FindByID",
                                queryID: currentCommand.queryID,
                                result: result,
                                error: err,
                                status: msg
                            });
                            console.log(msg);
                            response.resultList = resultList;
                            response.success = true;
                            res.send(response);
                            return;
                        });
                        return;
                    case "FindAssocTargetOptions":
                        // Find all elements in collection representing this type
                        var filter = currentCommand.filter ? currentCommand.filter.split("=") : null;
                        var query = {};
                        if (filter&&filter.length===2)
                            query[filter[0]]=RegExp(filter[1], "i");
                        var cursor = collection.find(query);
                        cursor.count(function (mongoErr1, count) {
                            cursor.skip(startingAt);
                            cursor.limit(entitiesPerPage);
                            cursor.toArray(function (mongoErr2, arr) {
                                var msg = "";
                                var err = false;
                                if (arr && !mongoErr1 && !mongoErr2) {
                                    resultList.push({
                                        queryType: "FindAssocTargetOptions",
                                        queryID: currentCommand.queryID,
                                        sourceID: currentCommand.sourceID,
                                        sourceType: currentCommand.sourceType,
                                        sourceRelnName: currentCommand.sourceRelnName,
                                        sourceRelnID: currentCommand.sourceRelnID,
                                        targetType: currentCommand.targetType,
                                        result: arr,
                                        queryResultsCount: count,
                                        error: err,
                                        status: msg
                                    });
                                    msg = "Found " + count + " instances for Type=" + targetType + " in Domain " + domain;
                                }
                                else {
                                    err = true;
                                    msg = mongoErr ? mongoErr : "No matching object for Type=" + targetType + " in Domain " + domain;
                                }
                                console.log(msg);
                                response.resultList = resultList;
                                response.success = true;
                                res.send(response);
                            });
                        });
                        return;
                    default:
                        throw "Unknown command: " + currentCommand.command;
                }
            });
        }
        catch
            (err) {
            response.success = false;
            response.error = err.toString();
            console.log("Error processing CRUD command: " + err);
            res.send(response);
        }
    }
    else {
        res.redirect(303, '/error');
    }
});

module.exports = appApiRouter;
