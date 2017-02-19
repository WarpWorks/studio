//
// ------------------------------------------------------------------------------------------------------------
// HeadStart
// ------------------------------------------------------------------------------------------------------------
//

var util = require("./Util.js");
var mongoClient=require('mongodb').MongoClient;

//
// Class "HeadStart"
//

function HeadStart() {
    this.parent = null;
    this.domains = [];

    this.model = require('./Model.js');
    this.view = require('./View.js');

    this.config = null;

    this.mongoDBs = {};
}

HeadStart.prototype = {
    createNewDomain: function (name, desc, recreate) {
        newDomain = new this.model.Domain(this, name, desc, recreate);
        this.domains.push(newDomain);
        return newDomain;
    },
    getAllDomains: function () {
        return this.domains;
    },
    isValidID: function (id) {
    return Number.isInteger(id);
    },
    getModels: function () {
        return this.model;
    },
    getViews: function () {
        return this.view;
    },
    getEngine: function () {
        return this._engine;
    },
    toString: function () {
        var s = "";
        for (i in this.domains) s += this.domains[i].toString() + "\n";
        return s;
    },

    // File i/o
    getDir: function (name) {
        var hsRoot = process.cwd()+"/";
        var cartridge = hsRoot+this.getConfig().cartridgePath+"/";
        var project   = hsRoot+this.getConfig().projectPath+"/";
        var output    = hsRoot+this.getConfig().outputPath+"/";
        switch (name) {
            // HeadStart files
            case "smnDemos": return hsRoot + "mda/smnModels/Demo/";
            // Cartridge files
            case "templates": return cartridge +"templates/";
            // Project files
            case "domains": return project + "domains/";
            // Output
            case "output": return output;
            throw "Invalid directory: "+name;
        }
    },

    readFile: function (fn) {
        fs = require('fs');
        var txt = fs.readFileSync(fn, 'utf8');
        return txt;
    }
}

//
// Config
//

HeadStart.config=null;
HeadStart.prototype.getConfig = function () {
    if (this.config) return this.config;
    var cfg = this.readFile(process.cwd()+"/config.json");
    this.config = JSON.parse(cfg);
    return this.config;
}

//
// MongoDB
//

HeadStart.prototype.getMongoURL = function (dbName) {
    return "mongodb://"+this.getConfig().mongoServer+"/"+dbName;
}

HeadStart.prototype.useDB = function (dbName, nextFunction) {
    var db = this.mongoDBs[dbName];
    var mDBs = this.mongoDBs;
    if (db) {
        // TBD: Check, if the connection is still valid!
        nextFunction(db);
    }
    else {
        try {
            mongoClient.connect(this.getMongoURL(dbName), function (err, db) {
                if (err)
                    console.log("Error connecting to DB: " + err);
                else {
                    mDBs[dbName] = db;
                    nextFunction(db);
                }
            });
        }
        catch (err) {
            console.log("Error connecting to DB: "+err);
        }
    }
}

HeadStart.prototype.removeAllDataFromDB = function (dbName) {
    // TBD: Why not drop DB instead (I remember there was a reason, but...)?
    this.useDB(dbName, function (db) {
        db.collections(function (err, collections) {
            if (err)
                console.log("Error retrieving collection names: " + err);
            else {
                console.log("*** Collection:");
                collections.forEach(function (collection) {
                    console.log("Dropping collection: " + collection.collectionName);
                    collection.drop(function (err, res) {
                        if (err)
                            console.log("Error dropping collection: " + err);
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

HeadStart.prototype.loadGeneratedHBSPartials = function () {
    var fs = require('fs');
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
        var partial = fs.readFileSync(workingDir + '/' + fn, 'utf8');
        hbs.registerPartial(name, partial);
    });
}
*/

//
// Template Processing
//
// Operators:
// [?]: Test if elements of this type exist
// [*]: Indicates that there can be multiple matches (mandatoy)
// [!]: For children of Entity only. Used to include inherited elements. Can be combined with [?]
//


// TBD:
// - Currently JavaScript is not executed if embedded in {{if}}...{{then}}...

HeadStart.prototype.createBeginTag = function (tagName, conditional) {
    if (conditional)
        return '{{' + tagName + '?}}';
    else
        return begin = "{{" + tagName + "*}}";
}

HeadStart.prototype.createEndTag = function (tagName, conditional) {
    if (conditional)
        return '{{/' + tagName + '?}}';
    else
        return end = "{{/" + tagName + "}}";
}

HeadStart.prototype.applyTemplateFile = function (fn, domains) {
    var template = this.readFile(fn);

    var beginTag = this.createBeginTag("Domain");
    var endTag = this.createEndTag("Domain");

    var tokenSeq = util.getTokenSeq(template, beginTag, endTag);
    for (var i in tokenSeq) {
        if (tokenSeq[i].isTagValue) {
            var ts = "";
            for (var j in domains)
                ts += domains[j].processLocalTemplateFunctions(tokenSeq[i].value);
            tokenSeq[i].value = ts;
        }
    }

    template = "";
    for (var i in tokenSeq)
        template += tokenSeq[i].value;

    return template;
}

//
// Simplified Model Notation (SMN)
//


HeadStart.prototype.createModelElementsFromSMN = function (smn, domain) {
    var model = this.parseSMN(smn);
    //console.log(JSON.stringify(model, null, 2));

    return this.createModel(model, domain);
}

HeadStart.prototype.createModel = function (model, domain) {
    var domainFromModel = null;
    for (var i in model) if (model[i].isDomain) domainFromModel = i;
    if (domain && domainFromModel) throw "Error: trying to add new domain #" + domainFromModel + " while also giving " + domain.name;
    if (!domain && domainFromModel) domain = this.createNewDomain(domainFromModel, domainFromModel + " from SMN");
    if (!domain || domain==null) throw "Error creating model from SMN - no domain specified!";

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
            if (domainElem) throw "Only one domain should be declared per SMN file!";
            domainElem = elem;
        }
        else {
            var entity = domain.addNewEntity(m, "");
            if (elem.baseClass) {
                entity.baseClass = elem.baseClass;
                newEntitiesWithParent.push(entity);
            }
            for (var n in elem.properties) {
                var p = elem.properties[n];
                if (p.type.includes("[")) {
                    var a = util.extractTagValue(p.type, "[", "]");
                    var en = entity.addNewEnum(p.property);
                    var literals = a[1].split("|");
                    for (var i in literals)
                        en.addNewLiteral(literals[i]);
                }
                else
                    entity.addNewBasicProperty(p.property, "", p.type);
            }
            for (var o in elem.aggregations) {
                var agg = elem.aggregations[o];
                var r = entity.addNewRelationship(null, true, agg.sourceRole);
                if (agg.targetType.includes("*"))
                    r.targetMax = "*";
                else if (agg.targetType.includes("+"))
                    r.targetMax = "+";
                newRelationships.push([agg.targetType, r]);
            }
            for (var p in elem.associations) {
                var ass = elem.associations[p];
                var r = entity.addNewRelationship(null, false, ass.sourceRole);
                newRelationships.push([ass.targetType, r]);
            }
        }
    }

    // Mark rootEntity instances
    if (domainElem) {
        if (domainElem.aggregations.length === 0) throw "Domain definition does not define child elements. Include '#MyDomain: {MyEntity*}' to do so!";
        for (var rel in domainElem.aggregations) {
            var targetType = domainElem.aggregations[rel].targetType;
            if (targetType.includes('*')) {
                targetType = targetType.replace("*", "");
            }
            else {
                console.log("Warning: Assuming cardinality '*' for rootEntity instance " + targetType);
                if (targetType.includes('+')) {
                    targetType = targetType.replace("+", "");
                }
            }
            var target = domain.findElementByName(targetType, "Entity");
            if (!target)
                throw "Error creating new relationship: No matching entity '" + targetType + "'!";
            target.setRootEntityStatus(true);
        }
    }

    // Resolve targets for parent classes
    var allElems = domain.getAllElements(true);
    for (var i in newEntitiesWithParent) {
        var entity = newEntitiesWithParent[i];
        var target = domain.findElementByName(entity.baseClass, "Entity");
        if (!target) throw "No matching parent entity '" + entity.baseClass + "' found for entity'" + entity.name + "'!";
        entity.setParentClass(target);
    }

    // Finally, resolve missing targets in relations
    for (var i in newRelationships) {
        var targetName = newRelationships[i][0];
        if (targetName.includes('*'))
            targetName = targetName.split("*")[0];
        if (targetName.includes('+'))
            targetName = targetName.split("+")[0];
        var rel = newRelationships[i][1];
        var target = domain.findElementByName(targetName, "Entity");
        if (!target) throw "No matching entity '" + targetName + "' for relationship '" + rel.name + "'!";
        rel.setTargetEntity(target);
        rel.updateDesc();
    }
    return domain;
}

HeadStart.prototype.parseSMN = function (smn) {
    // Remove whitespaces
    smn = smn.replace(/ /g, '');

    // Map each line to one element in new array
    var smnFile = smn.split("\n");

    //
    var model = {};

    // Now process each line:
    for (idx in smnFile) {
        // Remove '\r' and comments ('//'), ignore empty lines:
        var currentLine = smnFile[idx].replace(/\r/g, '');
        if (currentLine.includes("//"))
            currentLine = currentLine.split("//", 1)[0];
        if (currentLine.length < 1) continue;

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
            header = util.splitBySeparator(currentLine, ":")[0];
            body = util.splitBySeparator(currentLine, ":")[1];
        }
        else {
            header = currentLine;
        }

        // Inheritance?
        if (header.includes("(")) {
            if (!header.includes(")")) throw "Missing ')' in line " + (idx);
            entity = util.extractTagValue(header, "(", ")")[0];
            baseClass = util.extractTagValue(header, "(", ")")[1];
        }
        else
            entity = header;

        if (entity.length < 3) throw "Not a valid entity name: '" + entity + "' in line " + idx + " (name must have more than 2 characters)";

        // Add entity to model, if not already there
        if (!model[entity])
            model[entity] = {properties: [], aggregations: [], associations: [], isDomain: isDomainDefinition};

        // Add baseClass?
        if (baseClass.length > 1)
            model[entity].baseClass = baseClass;

        if (body.includes("{")) {
            if (!body.includes("}")) throw "Missing '}' in line " + idx;
            body = util.extractTagValue(body, "{", "}")[1];
            var aggregations = body.split(",");
            for (j in aggregations) {
                var agg = aggregations[j].split(":");
                if (agg.length === 1) {
                    var sr = agg[0].replace("*", "");
                    sr = sr.replace("+", "");
                    sr += "s";
                    agg = {sourceRole: sr, targetType: agg[0]};
                }
                else
                    agg = {sourceRole: agg[0], targetType: agg[1]};
                model[entity].aggregations.push(agg);
            }
        }
        else if (body.includes("=>")) {
            var associations = body.split(",");
            for (j in associations) {
                var assoc = associations[j].split("=>");
                if (assoc.length === 1 || assoc[0].length === 0)
                    assoc = {sourceRole: assoc[1], targetType: assoc[1]};
                else
                    assoc = {sourceRole: assoc[0], targetType: assoc[1]};
                model[entity].associations.push(assoc);
            }
        }
        else { // Properties
            var properties = body.split(",");
            if (properties.length === 1 && properties[0].length === 0) continue;
            for (j in properties) {
                var prop = properties[j].split(":");
                if (prop.length === 1) // No type information supplied, use string as default
                    prop = {property: prop[0], type: HeadStart.me.BasicTypes.String};
                else
                    prop = {property: prop[0], type: prop[1]};
                if (!this.isValidBasicType(prop.type) && !prop.type.includes("[")) throw "Invalid basic type '" + prop.type + "' in line " + idx;
                model[entity].properties.push(prop);
            }
        }
    }
    return model;
}

//
// Re-create model hierarchy from JSON data
//

HeadStart.prototype.createDomainFromJSONString = function (jsonData) {
    // Re-create model hierarchy:
    var domain = this.createInstanceFromJSON(JSON.parse(jsonData), this.ComplexTypes.Domain, this);

    // In the JSON format, in-memory references have been replaces with OIDs.
    // Now we must replace any of these OIDs with in-memory object references again
    var oid = -1;
    var target = null;
    for (i in domain.getEntities()) {
        var e = domain.getEntities()[i];
        if (e.hasParentClass()) {
            oid = e.getParentClass();
            target = domain.findElementByID(oid);
            if (target)
                e.setParentClass(target);
            else
                throw "Internal Error: Cannot find parent class for "+this.name;
        }
        for (i in e.relationships) {
            var r = e.relationships[i];
            oid = r.getTargetEntity();
            target = domain.findElementByID(oid);
            if (target)
                r.setTargetEntity(target);
            else
                throw "Internal Error: Cannot find target entity for "+this.name;
        }
        for (i in e.tableViews) {
            var tv = e.tableViews[i];
            for (j in tv.tableItems) {
                var ti = tv.tableItems[j];
                oid = ti.property;
                target = domain.findElementByID(oid);
                if (target)
                    ti.setProperty(target);
                else
                    throw "Internal Error: Cannot find property for "+ti.name;
            }
        }
        for (i in e.pageViews) {
            var pv = e.pageViews[i];
            for (j in pv.panels) {
                var p = pv.panels[j];
                for (k in p.relationshipPanelItems) {
                    var rpi = p.relationshipPanelItems[k];
                    oid = rpi.relationship;
                    target = domain.findElementByID(oid);
                    if (target)
                        rpi.setRelationship(target);
                    else
                        throw "Internal Error: Cannot find relationship for "+rpi.name;
                }
                for (l in p.basicPropertyPanelItems) {
                    var bppi = p.basicPropertyPanelItems[l];
                    oid = bppi.basicProperty;
                    target = domain.findElementByID(oid);
                    if (target)
                        bppi.setBasicProperty(target);
                    else
                        throw "Internal Error: Cannot find basic property for "+bppi.name;
                }
                for (m in p.enumPanelItems) {
                    var epi = p.enumPanelItems[m];
                    oid = epi.enumeration;
                    target = domain.findElementByID(oid);
                    if (target)
                        epi.setEnumeration(target);
                    else
                        throw "Internal Error: Cannot find enumeration for "+epi.name;
                }
            }
        }
    }
    return domain;
}

// Ugly, but necessary:
HeadStart.prototype.createInstanceFromJSON = function (jsonData, type, parent) {
    var t = jsonData.type;
    var id = jsonData.id;
    var name = jsonData.name;
    var desc = jsonData.desc;

    // Some basic validations
    if (t != type) throw "Element is of type '" + t + "'. Expected was '" + type + "'! ";
    if (!this.isValidID(id)) throw "Invalid ID!";
    if (!name) throw "No name specified for element of type: "+t;

    switch (type) {
        case this.ComplexTypes.Domain:
            var newDomain =                 this.createNewDomain(name, desc, true); // Recreate = true!
            newDomain.entities =            [];
            newDomain.definitionOfMany =    jsonData.definitionOfMany;
            for (i in jsonData.entities)
                newDomain.entities.push(this.createInstanceFromJSON(jsonData.entities[i], this.ComplexTypes.Entity, newDomain));
            return newDomain;
        case this.ComplexTypes.Entity:
            var newEntity =             new this.model.Entity(parent, id, name, desc);
            newEntity.isAbstract =      jsonData.isAbstract;
            newEntity.namePlural =      jsonData.namePlural;
            newEntity.isRootEntity =    jsonData.isRootEntity;
            newEntity.isRootInstance =  jsonData.isRootInstance;
            newEntity.parentClass =     jsonData.parentClass; // Convert OID to reference later!
            newEntity.basicProperties = [];
            for (i in jsonData.basicProperties)
                newEntity.basicProperties.push(this.createInstanceFromJSON(jsonData.basicProperties[i], this.ComplexTypes.BasicProperty, newEntity));
            newEntity.enums = [];
            for (i in jsonData.enums)
                newEntity.enums.push(this.createInstanceFromJSON(jsonData.enums[i], this.ComplexTypes.Enumeration, newEntity));
            newEntity.relationships = [];
            for (i in jsonData.relationships)
                newEntity.relationships.push(this.createInstanceFromJSON(jsonData.relationships[i], this.ComplexTypes.Relationship, newEntity));
            newEntity.pageViews = [];
            for (i in jsonData.pageViews)
                newEntity.pageViews.push(this.createInstanceFromJSON(jsonData.pageViews[i], this.ComplexTypes.PageView, newEntity));
            newEntity.tableViews = [];
            for (i in jsonData.tableViews)
                newEntity.tableViews.push(this.createInstanceFromJSON(jsonData.tableViews[i], this.ComplexTypes.TableView, newEntity));
            return newEntity;
        case this.ComplexTypes.BasicProperty:
            var newProperty =           new this.model.BasicProperty(parent, id, name, desc, jsonData.propertyType);
            newProperty.defaultValue =  jsonData.defaultValue;
            newProperty.constraints =   jsonData.constraints;
            newProperty.examples =      jsonData.examples;
            return newProperty;
        case this.ComplexTypes.Enumeration:
            var newEnumeration = new this.model.Enumeration(parent, id, name, desc);
            for (i in jsonData.literals)
                newEnumeration.literals.push(this.createInstanceFromJSON(jsonData.literals[i], this.ComplexTypes.Literal, newEnumeration));
            return newEnumeration;
        case this.ComplexTypes.Literal:
            var newLiteral = new this.model.Literal(parent, id, name, desc);
            return newLiteral;
        case this.ComplexTypes.Relationship:
            var newRelationship =               new this.model.Relationship(parent, jsonData.targetEntity, id, jsonData.isAggregation, name, desc);
            newRelationship.sourceRole =        jsonData.sourceRole;
            newRelationship.sourceMax =         jsonData.sourceMax;
            newRelationship.sourceMin =         jsonData.sourceMin;
            newRelationship.sourceAverage =     jsonData.sourceAverage;
            newRelationship.targetRole =        jsonData.targetRole;
            newRelationship.targetMin =         jsonData.targetMin;
            newRelationship.targetMax =         jsonData.targetMax;
            newRelationship.targetAverage =     jsonData.targetAverage;
            return newRelationship;
        case this.ComplexTypes.PageView:
            var newPageView =           new this.view.PageView(parent, id, name, desc);
            newPageView.isDefault =     jsonData.isDefault;
            newPageView.label =         jsonData.label;
            for (i in jsonData.panels)
                newPageView.panels.push(this.createInstanceFromJSON(jsonData.panels[i], this.ComplexTypes.Panel, newPageView));
            return newPageView;
        case this.ComplexTypes.Panel:
            var newPanel =                  new this.view.Panel(parent, id, name, desc);
            newPanel.label =                jsonData.label;
            newPanel.position =             jsonData.position;
            newPanel.columns =              jsonData.columns;
            newPanel.alternatingColors =    jsonData.alternatingColors;
            for (i in jsonData.separatorPanelItems)
                newPanel.separatorPanelItems.push(this.createInstanceFromJSON(jsonData.separatorPanelItems[i], this.ComplexTypes.SeparatorPanelItem, newPanel));
            for (i in jsonData.relationshipPanelItems)
                newPanel.relationshipPanelItems.push(this.createInstanceFromJSON(jsonData.relationshipPanelItems[i], this.ComplexTypes.RelationshipPanelItem, newPanel));
            for (i in jsonData.basicPropertyPanelItems)
                newPanel.basicPropertyPanelItems.push(this.createInstanceFromJSON(jsonData.basicPropertyPanelItems[i], this.ComplexTypes.BasicPropertyPanelItem, newPanel));
            for (i in jsonData.enumPanelItems)
                newPanel.enumPanelItems.push(this.createInstanceFromJSON(jsonData.enumPanelItems[i], this.ComplexTypes.EnumPanelItem, newPanel));
            return newPanel;
        case this.ComplexTypes.SeparatorPanelItem:
            var newSeparatorPanelItem =         new this.view.SeparatorPanelItem(parent, id, name, desc);
            newSeparatorPanelItem.position =    jsonData.position;
            newSeparatorPanelItem.label =       jsonData.label;
            return newSeparatorPanelItem;
        case this.ComplexTypes.RelationshipPanelItem:
            var newRelationshipPanelItem =          new this.view.RelationshipPanelItem(parent, id, name, desc);
            newRelationshipPanelItem.position =     jsonData.position;
            newRelationshipPanelItem.label =        jsonData.label;
            newRelationshipPanelItem.relationship = jsonData.relationship;
            return newRelationshipPanelItem;
        case this.ComplexTypes.BasicPropertyPanelItem:
            var newBasicPropertyPanelItem =             new this.view.BasicPropertyPanelItem(parent, id, name, desc);
            newBasicPropertyPanelItem.basicProperty =   jsonData.basicProperty;
            newBasicPropertyPanelItem.position =        jsonData.position;
            newBasicPropertyPanelItem.label =           jsonData.label;
            return newBasicPropertyPanelItem;
        case this.ComplexTypes.EnumPanelItem:
            var newEnumPanelItem =          new this.view.EnumPanelItem(parent, id, name, desc);
            newEnumPanelItem.position =     jsonData.position;
            newEnumPanelItem.label =        jsonData.label;
            newEnumPanelItem.enumeration =  jsonData.enumeration;
            return newEnumPanelItem;
        case this.ComplexTypes.TableView:
            var newTableView =              new this.view.TableView(parent, id, name, desc);
            newTableView.isDefault =        jsonData.isDefault;
            newTableView.label =            jsonData.label;
            for (i in jsonData.tableItems)
                newTableView.tableItems.push(this.createInstanceFromJSON(jsonData.tableItems[i], this.ComplexTypes.TableItem, newTableView));
            return newTableView;
        case this.ComplexTypes.TableItem:
            var newTableItem = new this.view.TableItem(parent, id, name, desc);
            newTableItem.position   = jsonData.position;
            newTableItem.label      = jsonData.label;
            newTableItem.property   = jsonData.property;
            return newTableItem;
        default:
            throw "Invalid type: " + type;
    }
}

//
// Create single instance
//

HeadStart.me = new HeadStart();

//
// Type-related Definitions
//

// TBD - move these definitions from "me" to "prototype"

HeadStart.me.BasicTypes = {String: "string", Number: "number", Boolean: "boolean", Date: "date"};
HeadStart.prototype.isValidBasicType = function (t) {
    for (i in HeadStart.me.BasicTypes) if (t === HeadStart.me.BasicTypes[i]) return true;
    return false;
}

HeadStart.me.ValidEnumSelections = {
    One: "Exactly One",
    ZeroOne: "Zero or One",
    ZeroMany: "Zero to Many",
    OneMany: "One to Many"
};

HeadStart.me.ComplexTypes = {
    Domain: "Domain",
    Entity: "Entity",
    BasicProperty: "BasicProperty",
    Enumeration: "Enumeration",
    Literal: "Literal",
    Relationship: "Relationship",
    PageView: "PageView",
    Panel: "Panel",
    SeparatorPanelItem: "SeparatorPanelItem",
    RelationshipPanelItem: "RelationshipPanelItem",
    BasicPropertyPanelItem: "BasicPropertyPanelItem",
    EnumPanelItem: "EnumPanelItem",
    TableView: "TableView",
    TableItem: "TableItem"
};

//
// ------------------------------------------------------------------------------------------------------------
// Export modules
// ------------------------------------------------------------------------------------------------------------
//

// Objects
exports.HeadStart = HeadStart.me;
