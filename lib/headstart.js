// const debug = require('debug')('HS:headstart');
const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const path = require('path');

const BasicTypes = require('./basic-types');
const ComplexTypes = require('./complex-types');
const config = require('./config');
const HeadStartError = require('./headstart-error');
const models = require('./models');
const utils = require("./utils");
const views = models.views;

const hsRoot = path.dirname(require.resolve('./../package.json'));

function isValidID(id) {
    return Number.isInteger(id);
}

function getMongoURL(dbName) {
    return `mongodb://${config.mongoServer}/${dbName}`;
}

class HeadStart {
    constructor() {
        this.parent = null;
        this.domains = [];
        this.config = null;
        this.mongoDBs = {};
    }

    createNewDomain(name, desc, recreate) {
        var newDomain = new models.Domain(this, name, desc, recreate);
        return newDomain;
    }

    getAllDomains() {
        return this.domains;
    }

    getDomainByName(domainName) {
        // let domain = this.domains.find((domain) => domain.name === domainName);
        // if (domain) {
        //     return domain;
        // }

        const domainFilePath = path.resolve(this.getDir('domains', `${domainName}.jsn`));

        const content = this.readFile(domainFilePath);
        const domainJson = JSON.parse(content);

        const domain = this.createDomainFromJSON(domainJson);

        // this.domains.push(domain);

        return domain;
    }

    expireDomainCache(domainName) {
        this.domains = this.domains.filter((d) => d.name !== domainName);
    }

    toString() {
        return this.domains.map((domain) => domain.toString()).join('\n') + '\n';
    }

    getDir(name, file) {
        // File i/o
        let folder;

        switch (name) {
            // HeadStart files
            case "smnDemos":
                folder = path.join(hsRoot, "mda", "smnModels", "Demo");
                break;

            // Cartridge files
            case "templates":
                folder = path.join(config.cartridgePath, 'templates');
                break;

            // Project files
            case "domains":
                folder = path.join(config.projectPath, 'domains');
                break;

            // Output
            case "output":
                folder = path.join(config.outputPath);
                break;

            default:
                throw new HeadStartError("Invalid directory: " + name);
        }

        if (file) {
            return path.join(folder, file);
        }
        return folder;
    }

    readDir(name) {
        const dir = this.getDir(name);
        return fs.readdirSync(dir).map((fn) => path.join(dir, fn));
    }

    readFile(fn) {
        return fs.readFileSync(fn, 'utf8');
    }

    smnFiles() {
        const files = this.readDir('smnDemos');
        return files.map((file) => {
            const name = path.basename(file, '.smn');
            const template = this.readFile(file);
            return {
                name,
                template
            };
        });
    }

    domainFiles() {
        const files = this.readDir('domains');

        return files.map((file) => {
            const name = path.basename(file, '.jsn');
            return {
                name,
                desc: 'TBD: Description'
            };
        });
    }

    //
    // MongoDB
    //

    useDB(dbName, nextFunction) {
        if (this.mongoDBs[dbName]) {
            // TBD: Check, if the connection is still valid!
            nextFunction(this.mongoDBs[dbName]);
        } else {
            try {
                mongoClient.connect(getMongoURL(dbName), function(err, db) {
                    if (err) {
                        console.log("Error connecting to DB: " + err);
                    } else {
                        instance.mongoDBs[dbName] = db;
                        nextFunction(db);
                    }
                });
            } catch (err) {
                console.log("Error connecting to DB: " + err);
            }
        }
    }

    //
    // Re-create model hierarchy from JSON data
    //
    createDomainFromJSONString(jsonSring) {
        return this.createDomainFromJSON(JSON.parse(jsonSring));
    }

    createDomainFromJSON(jsonData) {
        var i;
        var j;

        // Re-create model hierarchy:
        var domain = this.createInstanceFromJSON(jsonData, ComplexTypes.Domain, this);

        // In the JSON format, in-memory references have been replaced with OIDs.
        // Now we must replace any of these OIDs with in-memory object references again
        var oid = -1;
        var target = null;
        for (i in domain.getEntities()) {
            var e = domain.getEntities()[i];
            if (e.hasParentClass()) {
                oid = e.getParentClass();
                target = domain.findElementByID(oid);
                if (target) {
                    e.setParentClass(target);
                } else {
                    throw new HeadStartError("Internal Error: Cannot find parent class for " + this.name);
                }
            }
            for (i in e.relationships) {
                var r = e.relationships[i];
                oid = r.getTargetEntity();
                target = domain.findElementByID(oid);
                if (target) {
                    r.setTargetEntity(target);
                } else {
                    throw new HeadStartError("Internal Error: Cannot find target entity for " + this.name);
                }
            }
            for (i in e.tableViews) {
                var tv = e.tableViews[i];
                for (j in tv.tableItems) {
                    var ti = tv.tableItems[j];
                    oid = ti.property;
                    target = domain.findElementByID(oid);
                    if (target) {
                        ti.setProperty(target);
                    } else {
                        throw new HeadStartError("Internal Error: Cannot find property for " + ti.name);
                    }
                }
            }
            for (i in e.pageViews) {
                var pv = e.pageViews[i];
                for (j in pv.panels) {
                    var p = pv.panels[j];
                    for (var k in p.relationshipPanelItems) {
                        var rpi = p.relationshipPanelItems[k];
                        oid = rpi.relationship;
                        target = domain.findElementByID(oid);
                        if (target) {
                            rpi.setRelationship(target);
                        } else {
                            throw new HeadStartError("Internal Error: Cannot find relationship for " + rpi.name);
                        }
                    }
                    for (var l in p.basicPropertyPanelItems) {
                        var bppi = p.basicPropertyPanelItems[l];
                        oid = bppi.basicProperty;
                        target = domain.findElementByID(oid);
                        if (target) {
                            bppi.setBasicProperty(target);
                        } else {
                            throw new HeadStartError("Internal Error: Cannot find basic property for " + bppi.name);
                        }
                    }
                    for (var m in p.enumPanelItems) {
                        var epi = p.enumPanelItems[m];
                        oid = epi.enumeration;
                        target = domain.findElementByID(oid);
                        if (target) {
                            epi.setEnumeration(target);
                        } else {
                            throw new HeadStartError("Internal Error: Cannot find enumeration for " + epi.name);
                        }
                    }
                }
            }
        }
        return domain;
    }

    // Ugly, but necessary:
    createInstanceFromJSON(jsonData, type, parent) {
        var i;
        var newRelationshipPanelItem;
        var t = jsonData.type;
        var id = jsonData.id;
        var name = jsonData.name;
        var desc = jsonData.desc;

        // Some basic validations
        if (t !== type) {
            throw new HeadStartError("Element is of type '" + t + "'. Expected was '" + type + "'! ");
        }
        if (!isValidID(id)) {
            throw new HeadStartError("Invalid ID!");
        }
        if (!name) {
            throw new HeadStartError("No name specified for element of type: " + t);
        }

        switch (type) {
            case ComplexTypes.Domain:
                var newDomain = this.createNewDomain(name, desc, true); // Recreate = true!
                newDomain.entities = [];
                newDomain.definitionOfMany = jsonData.definitionOfMany;
                for (i in jsonData.entities) {
                    newDomain.entities.push(this.createInstanceFromJSON(jsonData.entities[i], ComplexTypes.Entity, newDomain));
                }
                return newDomain;
            case ComplexTypes.Entity:
                var newEntity = new models.Entity(parent, id, name, desc);
                newEntity.isAbstract = jsonData.isAbstract;
                newEntity.namePlural = jsonData.namePlural;
                newEntity.isRootEntity = jsonData.isRootEntity;
                newEntity.isRootInstance = jsonData.isRootInstance;
                newEntity.parentClass = jsonData.parentClass; // Convert OID to reference later!
                newEntity.basicProperties = [];
                for (i in jsonData.basicProperties) {
                    newEntity.basicProperties.push(this.createInstanceFromJSON(jsonData.basicProperties[i], ComplexTypes.BasicProperty, newEntity));
                }
                newEntity.enums = [];
                for (i in jsonData.enums) {
                    newEntity.enums.push(this.createInstanceFromJSON(jsonData.enums[i], ComplexTypes.Enumeration, newEntity));
                }
                newEntity.relationships = [];
                for (i in jsonData.relationships) {
                    newEntity.relationships.push(this.createInstanceFromJSON(jsonData.relationships[i], ComplexTypes.Relationship, newEntity));
                }
                newEntity.pageViews = [];
                for (i in jsonData.pageViews) {
                    newEntity.pageViews.push(this.createInstanceFromJSON(jsonData.pageViews[i], ComplexTypes.PageView, newEntity));
                }
                newEntity.tableViews = [];
                for (i in jsonData.tableViews) {
                    newEntity.tableViews.push(this.createInstanceFromJSON(jsonData.tableViews[i], ComplexTypes.TableView, newEntity));
                }
                return newEntity;
            case ComplexTypes.BasicProperty:
                var newProperty = new models.BasicProperty(parent, id, name, desc, jsonData.propertyType);
                newProperty.defaultValue = jsonData.defaultValue;
                newProperty.constraints = jsonData.constraints;
                newProperty.examples = jsonData.examples;
                return newProperty;
            case ComplexTypes.Enumeration:
                var newEnumeration = new models.Enumeration(parent, id, name, desc);
                for (i in jsonData.literals) {
                    newEnumeration.literals.push(this.createInstanceFromJSON(jsonData.literals[i], ComplexTypes.Literal, newEnumeration));
                }
                return newEnumeration;
            case ComplexTypes.Literal:
                var newLiteral = new models.Literal(parent, id, name, desc);
                return newLiteral;
            case ComplexTypes.Relationship:
                var newRelationship = new models.Relationship(parent, jsonData.targetEntity, id, jsonData.isAggregation, name, desc);
                newRelationship.sourceRole = jsonData.sourceRole;
                newRelationship.sourceMax = jsonData.sourceMax;
                newRelationship.sourceMin = jsonData.sourceMin;
                newRelationship.sourceAverage = jsonData.sourceAverage;
                newRelationship.targetRole = jsonData.targetRole;
                newRelationship.targetMin = jsonData.targetMin;
                newRelationship.targetMax = jsonData.targetMax;
                newRelationship.targetAverage = jsonData.targetAverage;
                return newRelationship;
            case ComplexTypes.PageView:
                var newPageView = new views.PageView(parent, id, name, desc);
                newPageView.isDefault = jsonData.isDefault;
                newPageView.label = jsonData.label;
                for (i in jsonData.panels) {
                    newPageView.panels.push(this.createInstanceFromJSON(jsonData.panels[i], ComplexTypes.Panel, newPageView));
                }
                return newPageView;
            case ComplexTypes.Panel:
                var newPanel = new views.Panel(parent, id, name, desc);
                newPanel.label = jsonData.label;
                newPanel.position = jsonData.position;
                newPanel.columns = jsonData.columns;
                newPanel.alternatingColors = jsonData.alternatingColors;
                for (i in jsonData.separatorPanelItems) {
                    newPanel.separatorPanelItems.push(this.createInstanceFromJSON(jsonData.separatorPanelItems[i], ComplexTypes.SeparatorPanelItem, newPanel));
                }
                for (i in jsonData.relationshipPanelItems) {
                    newPanel.relationshipPanelItems.push(
                        this.createInstanceFromJSON(jsonData.relationshipPanelItems[i], ComplexTypes.RelationshipPanelItem, newPanel)
                    );
                }
                for (i in jsonData.basicPropertyPanelItems) {
                    newPanel.basicPropertyPanelItems.push(this.createInstanceFromJSON(jsonData.basicPropertyPanelItems[i], ComplexTypes.BasicPropertyPanelItem, newPanel));
                }
                for (i in jsonData.enumPanelItems) {
                    newPanel.enumPanelItems.push(this.createInstanceFromJSON(jsonData.enumPanelItems[i], ComplexTypes.EnumPanelItem, newPanel));
                }
                for (i in jsonData.actions) {
                    newPanel.actions.push(this.createInstanceFromJSON(jsonData.actions[i], ComplexTypes.Action, newPanel));
                }
                return newPanel;
            case ComplexTypes.SeparatorPanelItem:
                var newSeparatorPanelItem = new views.SeparatorPanelItem(parent, id, name, desc);
                newSeparatorPanelItem.position = jsonData.position;
                newSeparatorPanelItem.label = jsonData.label;
                return newSeparatorPanelItem;
            case ComplexTypes.RelationshipPanelItem:
                newRelationshipPanelItem = new views.RelationshipPanelItem(parent, id, name, desc);
                newRelationshipPanelItem.position = jsonData.position;
                newRelationshipPanelItem.label = jsonData.label;
                newRelationshipPanelItem.relationship = jsonData.relationship;
                newRelationshipPanelItem.style = jsonData.style;
                return newRelationshipPanelItem;
            case ComplexTypes.BasicPropertyPanelItem:
                var newBasicPropertyPanelItem = new views.BasicPropertyPanelItem(parent, id, name, desc);
                newBasicPropertyPanelItem.basicProperty = jsonData.basicProperty;
                newBasicPropertyPanelItem.position = jsonData.position;
                newBasicPropertyPanelItem.label = jsonData.label;
                return newBasicPropertyPanelItem;
            case ComplexTypes.EnumPanelItem:
                var newEnumPanelItem = new views.EnumPanelItem(parent, id, name, desc);
                newEnumPanelItem.position = jsonData.position;
                newEnumPanelItem.label = jsonData.label;
                newEnumPanelItem.enumeration = jsonData.enumeration;
                return newEnumPanelItem;
            case ComplexTypes.Action:
                var newAction = new views.Action(parent, id, name, desc);
                newAction.icon = jsonData.icon;
                newAction.label = jsonData.label;
                newAction.functionName = jsonData.functionName;
                return newAction;
            case ComplexTypes.TableView:
                var newTableView = new views.TableView(parent, id, name, desc);
                newTableView.isDefault = jsonData.isDefault;
                newTableView.label = jsonData.label;
                for (i in jsonData.tableItems) {
                    newTableView.tableItems.push(this.createInstanceFromJSON(jsonData.tableItems[i], ComplexTypes.TableItem, newTableView));
                }
                return newTableView;
            case ComplexTypes.TableItem:
                var newTableItem = new views.TableItem(parent, id, name, desc);
                newTableItem.position = jsonData.position;
                newTableItem.label = jsonData.label;
                newTableItem.property = jsonData.property;
                return newTableItem;
            default:
                throw new HeadStartError("Invalid type: " + type);
        }
    }

    removeAllDataFromDB(dbName) {
        // TBD: Why not drop DB instead (I remember there was a reason, but...)?
        this.useDB(dbName, function(db) {
            db.collections(function(err, collections) {
                if (err) {
                    console.log("Error retrieving collection names: " + err);
                } else {
                    console.log("*** Collection:");
                    collections.forEach(function(collection) {
                        console.log("Dropping collection: " + collection.collectionName);
                        collection.drop(function(err, res) {
                            if (err) {
                                console.log("Error dropping collection: " + err);
                            }
                        });
                    });
                }
            });
        });
    }

    /* TBD:

    //
    // Making partials available to express
    //

    loadGeneratedHBSPartials () {
        var hbs = require('hbs');

        // TBD: Load all project partials:
        var workingDir = this.getDir(__dirname + '/../../../appData/generated';

        var files = fs.readdirSync(workingDir);

        files.forEach(function (fn) {
            var matches = /^([^.]+).hbs$/.exec(fn);
            if (!matches) {
                console.log("Not a match:" + matches);
                return;
            }
            var name = matches[1];
            var partial = this.readFile(path.join(workingDir, fn));
            hbs.registerPartial(name, partial);
        });
    }
    */

    //
    // Template Processing
    //
    // Operators:
    // [?]: Test if elements of this type exist
    // [*]: Indicates that there can be multiple matches (mandatory)
    // [!]: For children of Entity only. Used to include inherited elements. Can be combined with [?]
    //

    // TBD:
    // - Currently JavaScript is not executed if embedded in {{if}}...{{then}}...

    applyTemplateFile(fn, domains) {
        var template = this.readFile(fn);

        var beginTag = utils.createBeginTag("Domain");
        var endTag = utils.createEndTag("Domain");

        var tokenSeq = utils.getTokenSeq(template, beginTag, endTag);
        tokenSeq.forEach((token) => {
            if (token.isTagValue) {
                var ts = "";
                domains.forEach((domain) => {
                    ts += domain.processLocalTemplateFunctions(token.value);
                });
                token.value = ts;
            }
        });

        template = tokenSeq.map((token) => token.value).join('');

        return template;
    }

    //
    // Simplified Model Notation (SMN)
    //

    createModelElementsFromSMN(smn, domain) {
        var model = this.parseSMN(smn);
        // console.log(JSON.stringify(model, null, 2));

        return this.createModel(model, domain);
    }

    createModel(model, domain) {
        var i;
        var r;
        var rel;

        var domainFromModel = null;
        for (i in model) {
            if (model[i].isDomain) {
                domainFromModel = i;
            }
        }
        if (domain && domainFromModel) {
            throw new HeadStartError("Error: trying to add new domain #" + domainFromModel + " while also giving " + domain.name);
        }
        if (!domain && domainFromModel) {
            domain = this.createNewDomain(domainFromModel, domainFromModel + " from SMN");
        }
        if (!domain || domain == null) {
            throw new HeadStartError("Error creating model from SMN - no domain specified!");
        }

        // Remember new entities with unresolved parentClass
        var newEntitiesWithParent = [];

        // Remember newly created relationships, so that we can resolve the targets later
        var newRelationships = [];

        // Remember domain definition, if included
        var domainElem = null;

        // Create new entities
        for (var m in model) {
            var elem = model[m];
            if (elem.isDomain) {
                if (domainElem) {
                    throw new HeadStartError("Only one domain should be declared per SMN file!");
                }
                domainElem = elem;
            } else {
                var entity = domain.addNewEntity(m, "");
                entity.isAbstract = elem.isAbstract;
                if (elem.baseClass) {
                    entity.baseClass = elem.baseClass;
                    newEntitiesWithParent.push(entity);
                }

                elem.properties.forEach((p) => {
                    if (p.type.includes("[")) {
                        var a = utils.extractTagValue(p.type, "[", "]");
                        var en = entity.addNewEnum(p.property);
                        var literals = a[1].split("|");
                        literals.forEach((literal) => {
                            en.addNewLiteral(literal);
                        });
                    } else {
                        entity.addNewBasicProperty(p.property, "", p.type);
                    }
                });

                elem.aggregations.forEach((agg) => {
                    r = entity.addNewRelationship(null, true, agg.sourceRole);
                    if (agg.targetType.includes("*")) {
                        r.targetMax = "*";
                    } else if (agg.targetType.includes("+")) {
                        r.targetMax = "+";
                    }
                    newRelationships.push([agg.targetType, r]);
                });

                elem.associations.forEach((association) => {
                    r = entity.addNewRelationship(null, false, association.sourceRole);
                    newRelationships.push([association.targetType, r]);
                });
            }
        }

        // Mark rootEntity instances
        if (domainElem) {
            if (domainElem.aggregations.length === 0) {
                throw new HeadStartError("Domain definition does not define child elements. Include '#MyDomain: {MyEntity*}' to do so!");
            }
            for (rel in domainElem.aggregations) {
                var targetType = domainElem.aggregations[rel].targetType;
                if (targetType.includes('*')) {
                    targetType = targetType.replace("*", "");
                } else {
                    console.log("Warning: Assuming cardinality '*' for rootEntity instance " + targetType);
                    if (targetType.includes('+')) {
                        targetType = targetType.replace("+", "");
                    }
                }
                var target = domain.findElementByName(targetType, "Entity");
                if (!target) {
                    throw new HeadStartError("Error creating new relationship: No matching entity '" + targetType + "'!");
                }
                target.setRootEntityStatus(true);
            }
        }

        // Resolve targets for parent classes
        for (i in newEntitiesWithParent) {
            entity = newEntitiesWithParent[i];
            target = domain.findElementByName(entity.baseClass, "Entity");
            if (!target) {
                throw new HeadStartError("No matching parent entity '" + entity.baseClass + "' found for entity'" + entity.name + "'!");
            }
            entity.setParentClass(target);
        }

        // Finally, resolve missing targets in relations
        for (i in newRelationships) {
            var targetName = newRelationships[i][0];
            if (targetName.includes('*')) {
                targetName = targetName.split("*")[0];
            }
            if (targetName.includes('+')) {
                targetName = targetName.split("+")[0];
            }
            rel = newRelationships[i][1];
            target = domain.findElementByName(targetName, "Entity");
            if (!target) {
                throw new HeadStartError("No matching entity '" + targetName + "' for relationship '" + rel.name + "'!");
            }
            rel.setTargetEntity(target);
            rel.updateDesc();
        }
        return domain;
    }

    parseSMN(smn) {
        var currentLine;
        var idx;

        // Remove whitespaces
        smn = smn.replace(/ /g, '');

        // Map each line to one element in new array
        var smnFile = smn.split("\n");

        // If a line starts with "-", append it to previous line
        // Also, remove comments
        var smnFileMerged = [];
        for (idx in smnFile) {
            currentLine = smnFile[idx];
            if (currentLine.includes("//")) {
                currentLine = currentLine.split("//", 1)[0];
            }
            if (currentLine.length > 0 && currentLine[0] === "-") {
                smnFileMerged[smnFileMerged.length - 1] = smnFileMerged[smnFileMerged.length - 1] + "," + currentLine.substr(1);
            } else {
                smnFileMerged.push(currentLine);
            }
        }

        // Start with empty model
        var model = {};

        // Now process each line:
        for (idx in smnFileMerged) {
            var token;

            // Remove '\r' and comments ('//'), ignore empty lines:
            currentLine = smnFileMerged[idx].replace(/\r/g, '');
            if (currentLine.length < 1) {
                continue;
            }

            var header = "";
            var body = "";

            var entity = "";
            var baseClass = "";

            var isDomainDefinition = false;
            if (currentLine.charAt(0) === '#') {
                isDomainDefinition = true;
                currentLine = currentLine.slice(1);
            }

            if (currentLine.includes(":")) {
                header = utils.splitBySeparator(currentLine, ":")[0];
                body = utils.splitBySeparator(currentLine, ":")[1];
            } else {
                header = currentLine;
                body = "";
            }

            var isAbstract = false;
            if (header[0] === "%") {
                isAbstract = true;
                header = header.slice(1);
            }

            // Inheritance?
            if (header.includes("(")) {
                if (!header.includes(")")) {
                    throw new HeadStartError("Missing ')' in line " + idx);
                }
                entity = utils.extractTagValue(header, "(", ")")[0];
                baseClass = utils.extractTagValue(header, "(", ")")[1];
            } else {
                entity = header;
            }

            if (entity.length < 3) {
                throw new HeadStartError("Not a valid entity name: '" + entity + "' in line " + idx + " (name must have more than 2 characters)");
            }

            // Add entity to model, if not already there
            if (!model[entity]) {
                model[entity] = {
                    properties: [],
                    aggregations: [],
                    associations: [],
                    isDomain: isDomainDefinition,
                    isAbstract: isAbstract
                };
            }

            // Add baseClass?
            if (baseClass.length > 1) {
                model[entity].baseClass = baseClass;
            }

            // Parse aggregations
            while (body.includes("{")) {
                if (!body.includes("}")) {
                    throw new HeadStartError("Missing '}' in line " + idx);
                }
                var s = utils.extractTagValue(body, "{", "}");
                token = s[1];
                body = s[0] + (s.length > 2 ? s[2] : "");
                var aggregations = token.split(",");
                for (var j in aggregations) {
                    var agg = aggregations[j].split(":");
                    if (agg.length === 1) {
                        var sr = agg[0].replace("*", "");
                        sr = sr.replace("+", "");
                        sr += "s";
                        agg = {sourceRole: sr, targetType: agg[0]};
                    } else {
                        agg = {sourceRole: agg[0], targetType: agg[1]};
                    }
                    model[entity].aggregations.push(agg);
                }
            }

            // Now parse definitions of attributes and associations
            if (body.replace(/\s/g, '').length > 0) {
                // Body is not empty
                var tokens = body.split(",");
                for (idx = 0; idx < tokens.length; idx++) {
                    token = tokens[idx];
                    if (!token.replace(/\s/g, '').length > 0) {
                        continue;
                    }
                    if (token.includes("=>")) { // Association
                        var assoc = token.split("=>");
                        if (assoc.length === 1 || assoc[0].length === 0) {
                            assoc = {sourceRole: assoc[1], targetType: assoc[1]};
                        } else {
                            assoc = {sourceRole: assoc[0], targetType: assoc[1]};
                        }
                        model[entity].associations.push(assoc);
                    } else { // Property
                        var prop = token.split(":");
                        if (prop.length === 1) {
                            // No type information supplied, use string as default
                            prop = {property: prop[0], type: BasicTypes.String};
                        } else {
                            prop = {property: prop[0], type: prop[1]};
                        }
                        if (!BasicTypes.isValid(prop.type) && !prop.type.includes("[")) {
                            throw new HeadStartError("Invalid basic type '" + prop.type + "' in line " + idx);
                        }
                        model[entity].properties.push(prop);
                    }
                }
            }
        }
        return model;
    }
}

//
// Create single instance
//
var instance = new HeadStart();
module.exports = instance;
