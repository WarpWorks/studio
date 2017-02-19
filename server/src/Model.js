// ***************************************************************************************************** //
// Domain "Model"
// ***************************************************************************************************** //

var util = require("./Util.js");

//
// Class "Base"
//

// Constructor

function Base(type, parent, id, name, desc) {
    // Set basic attributes first (needed for validation below)
    this.type = type;
    this.parent = parent;
    this.id = id;
    this.name = name.replace(/ /g, ''); // Remove whitespaces
    this.desc = desc;

    // Validate name
    if (!this.isValidName(name))
        throw "Invalid name: '" + name + "'. Please use only a-z, A-Z, 0-9 or _!";

    /* TBD: Decide if we want to enforce unique names within a domain?
    var duplicate = this.getDomain().findElementByName(name);
    if (duplicate && duplicate != this)
        throw "Error creating element of type '"+type+"'! Name '"+name+"' already used by element of type '"+duplicate.type+"' in same domain!";
    */

    // This is the top-level element; it will be resolved dynamically
    this.headstart = null;
}

// Getter / setter

// Methods

Base.prototype.isValidName = function (name) {
    return !/\W/i.test(name) && name.length > 1;
}

Base.prototype.getHeadStart = function () {
    if (!this.headstart) {
        this.headstart = this;
        while (this.headstart.parent) this.headstart = this.headstart.parent;
    }
    var res = this.headstart;
    return res;
}

Base.prototype.getDomain = function () {
    var domain = this;
    while (domain.type != "Domain")
        domain = domain.parent;
    return domain;
}

Base.prototype.isOfType = function (t) {
    return this.type === t;
}

Base.prototype.compareToMyID = function (id) {
    return this.getDomain().compareIDs(this.id, id);
}


Base.prototype.idToJSON = function () {
    return this.id;
}

Base.prototype.findElementByID = function (id) {
    var allElems = this.getAllElements(true);
    for (i in allElems) if (this.getDomain().compareIDs(id, allElems[i].id)) {
        var r = allElems[i];
        return r;
    }
    return null;
}

Base.prototype.findElementByName = function (name, type) {
    var allElems = this.getAllElements(true);
    for (i in allElems) if ((allElems[i].name === name)
                            && (!type || allElems[i].type === type)) {
            return allElems[i];
    }
    return null;
}

Base.prototype.getPath = function () {
    var s = this.name;
    var p = this.parent;
    while (p) {
        var t = "";
        s = p.name + "/" + s;
        p = p.parent;
    }
    return "/" + s;
}

//
// Template Processing
//

Base.prototype.processLocalTemplateFunctions = function (template) {
    // Evaluate "condition" in "{{Options}}"
    if (!this.evaluateTemplateCondition(template)) return null;

    // Process if/then/else tags
    template = this.processIfThenElse(template);

    // Execute scriptlets:
    template = this.processScripts(template);

    // Perform actions in options, e.g. "saveAs"
    template = this.processOptions(template);

    return template;
}

Base.prototype.processTemplateWithChildElements = function (template, children) {
    for (var idx in children) {
        var child = children[idx];
        var type = child[0];
        var elements = child[1];
        var beginTag = this.getHeadStart().createBeginTag(type);
        var endTag = this.getHeadStart().createEndTag(type);

        var tokenSeq = util.getTokenSeq(template, beginTag, endTag);
        for (var i in tokenSeq) {
            if (tokenSeq[i].isTagValue) {
                var ts = "";
                var itemPos = 0;
                var hasExecutedAtLeastOnce = false;
                if (elements) {
                    elements.forEach(function (childElem) {
                        // Declare some temporary variables that can be used in the template`s java scriptlets:
                        childElem.itemPos = itemPos;
                        childElem.itemIsFirst = itemPos === 0;

                        // Apply template to child element:
                        var res = childElem.processLocalTemplateFunctions(tokenSeq[i].value);
                        if (res) {
                            ts += res;
                            itemPos++;
                            hasExecutedAtLeastOnce = true;
                        }

                        // And now remove temporary variables:
                        delete childElem.itemPos;
                        delete childElem.itemIsFirst;
                    });
                }
                tokenSeq[i].value = ts;
            }
        }

        // Re-construct template from token sequence
        template = "";
        for (var i in tokenSeq) {
            template += tokenSeq[i].value;
        }

        // If no elements available, remove conditional tags, e.g. {{Entity?}} ... {{/Entity?}}
        template = this.processConditionalTagValues(template, type, !hasExecutedAtLeastOnce);
    }
    return template;
}

Base.prototype.evaluateTemplateCondition = function (template) {
    if (!template.includes("{{Options}}")) return true;
    var a = util.extractTagValue(template, "{{Options}}", "{{/Options}}");
    var options = JSON.parse(a[1]);
    if (!options.condition) return true;
    return this.evalWithContext(options.condition);
}

Base.prototype.processOptions = function (template) {
    if (template.includes("{{Options}}")) {
        var a = util.extractTagValue(template, "{{Options}}", "{{/Options}}");

        // Re-construct template
        template = a[0] + a[2];
        if (template.includes("{{Options}}")) throw "{{Options}} should only be included once!"

        var options = JSON.parse(a[1]);
        if (options.saveAs) {
            var target = options.saveAs;
            this.saveTemplateResults(template, target);
        }
    }
    return template;
}

Base.prototype.processIfThenElse = function (template) {
    while (template.includes("{{if}}")) {
        var before_ite_after = util.extractTagValue(template, "{{if}}", "{{/if}}");
        var ifthenelse = null;

        if (before_ite_after[1].includes("{{else}}"))
            ifthenelse = util.extractTagValue(before_ite_after[1], "{{then}}", "{{else}}");
        else
            ifthenelse = util.splitBySeparator(before_ite_after[1], "{{then}}");

        var ifexp = ifthenelse[0];
        var condition = this.evalWithContext(ifexp);

        var res = "";

        if (condition) // keep the 'if' part
            res = ifthenelse[1];
        if (!condition && ifthenelse.length === 3) // else was defined, keep else part
            res = ifthenelse[2];

        template = before_ite_after[0] + res + before_ite_after[2];
    }
    return template;
}

Base.prototype.processConditionalTagValues = function (template, type, removeContent) {
    var begin = this.getHeadStart().createBeginTag(type, true);
    var end = this.getHeadStart().createEndTag(type, true);

    while (template.includes(begin)) {
        var res = util.extractTagValue(template, begin, end);
        if (res.length != 3) throw "Error";
        if (removeContent)
            template = res[0] + res[2]; // Remove content
        else
            template = res[0] + res[1] + res[2]; // Return everything (minus the tags)
    }
    return template;
}

Base.prototype.processScripts = function (template) {
    if (template === null) throw "Internal error";
    var begin = "{{js:";
    var end = "/}}";
    while (template.includes(begin)) {
        var tokens = util.extractTagValue(template, begin, end);
        var pre = tokens[0];
        var script = tokens[1];
        var post = tokens[2];

        try {
            var scriptResult = this.evalWithContext(script);
        }
        catch (err) {
            console.log("While processing scriptlet in template:");
            console.log("Element level:" + this.name);
            console.log("Scriptlet:" + tokens);
            console.log("Error: " + err);
        }

        template = template.replace(begin + script + end, scriptResult);
    }
    return template;
}

Base.prototype.evalWithContext = function (js) {
    // Return the results of the in-line anonymous function we call with the passed context
    return function () {
        return eval(js);
    }.call(this);
}

var count = 1;

Base.prototype.saveTemplateResults = function (result, target) {
    if (!target || target.length!==2)
        throw "Invalid target in 'onSave'-option!";

    var fn = this.evalWithContext(target[1]);
    fn = this.getHeadStart().getDir("output")+target[0]+"/"+fn;

    var fs = require('fs');
    fs.writeFile(fn, result, function (err) {
        if (err) return console.log("*** Error: " + err);
        console.log("New file generated: '" + fn + "'");
    });
}

//
// END Base Template Processing
//

//
// Class "Literal"
//

// Constructor and inheritance

function Literal(enumeration, id, name, desc) {
    Base.call(this, "Literal", enumeration, id, name, desc);
    this.position = null;
    this.icon = null;
}
Literal.prototype = Object.create(Base.prototype);
Literal.prototype.constructor = Literal;

// Methods

Literal.prototype.getParent_Enumeration = function () {
    return this.parent;
}

Literal.prototype.toString = function () {
    return this.name;
}

Literal.prototype.toJSON = function () {
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON()
    }
}

//
// Class "Enumeration"
//

// Constructor and inheritance

function Enumeration(entity, id, name, desc) {
    Base.call(this, "Enumeration", entity, id, name, desc);
    this.validEnumSelections = this.getHeadStart().ValidEnumSelections.ZeroOne;
    this.literals = [];
}
Enumeration.prototype = Object.create(Base.prototype);
Enumeration.prototype.constructor = Enumeration;

// Methods

Enumeration.prototype.getParent_Entity = function () {
    return this.parent;
}

Enumeration.prototype.processLocalTemplateFunctions = function (template) {
    var children = [["Literal", this.literals]];
    template = this.processTemplateWithChildElements(template, children);
    return Base.prototype.processLocalTemplateFunctions.call(this, template);
}

Enumeration.prototype.addNewLiteral = function (name, desc, validSelection) {
    var id = this.getDomain().createNewID();
    var newLiteral = new Literal(this, id, name, desc, validSelection);
    this.literals.push(newLiteral);
    return newLiteral;
}

Enumeration.prototype.getAllElements = function (includeSelf) {
    var r = new Array();
    if (includeSelf)
        r = r.concat(this);
    // Add children with no own children directly:
    r = r.concat(this.literals);
    return r;
}

Enumeration.prototype.getTestData = function () {
    if (this.literals && this.literals.length>0)
        return this.literals[Math.floor(Math.random() * this.literals.length)].name;
    else
        return "Undefined";
}

Enumeration.prototype.toString = function () {
    var s = this.name + ":[";
    for (i in this.literals) {
        var l = this.literals[i].toString();
        if (i != 0) l = "|" + l;
        s += l;
    }
    return s + "]";
}

Enumeration.prototype.toJSON = function () {
    var l = [];
    for (i in this.literals) l.push(this.literals[i].toJSON());

    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        literals: l
    }
}

//
// Class "BasicProperty"
//

// Constructor and inheritance

function BasicProperty(entity, id, name, desc, propertyType) {
    Base.call(this, "BasicProperty", entity, id, name, desc);
    this.propertyType = propertyType;

    this.constraints = null;
    this.examples = null;

    switch (propertyType) {
        case this.getHeadStart().BasicTypes.String:
            this.defaultValue = "'text'";
            break;
        case this.getHeadStart().BasicTypes.Number:
            this.defaultValue = 0;
            break;
        case this.getHeadStart().BasicTypes.Boolean:
            this.defaultValue = true;
            break;
        case this.getHeadStart().BasicTypes.Date:
            this.defaultValue = '"' + (new Date()).toLocaleString() + '"';
            break;
        default:
            throw "Invalid BasicType: " + propertyType;
    }
}
BasicProperty.prototype = Object.create(Base.prototype);
BasicProperty.prototype.constructor = BasicProperty;

// Methods

BasicProperty.prototype.getParent_Entity = function () {
    return this.parent;
}


BasicProperty.prototype.getTestData = function () {
    switch (this.propertyType) {
        case this.getHeadStart().BasicTypes.String:
            var testData = ["Lorem", "Ipsum", "Dolor", "Amet", "Consetetur", "Sadipscing"];
            if (this.examples) testData = this.examples.split(",");
            return testData[Math.floor(Math.random() * testData.length)];
        case this.getHeadStart().BasicTypes.Number:
            return Math.floor(Math.random() * 1000);
        case this.getHeadStart().BasicTypes.Boolean:
            return Math.random() * 100 < 50 ? true : false;
        case this.getHeadStart().BasicTypes.Date:
            var testData = ["2016/12/24", "1970/12/10", "2014/12/28", "2012/02/05", "1977/12/16"];
            return testData[Math.floor(Math.random() * testData.length)];
        default:
            throw "Invalid BasicType: " + propertyType;
    }
}

BasicProperty.prototype.toString = function () {
    return this.name + ":" + this.propertyType;
}

BasicProperty.prototype.toJSON = function () {
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        defaultValue: this.defaultValue,
        constraints: this.constraints,
        examples: this.examples,
        propertyType: this.propertyType
    };
}

//
// Class "Relationship"
//

// Constructor and inheritance

function Relationship(parent, target, id, isAggregation, name) {
    Base.call(this, "Relationship", parent, id, name, "");
    this.isAggregation = isAggregation;
    this.targetEntity = [target];
    this.sourceRole = "Source Role";
    this.sourceMin = "1";
    this.sourceMax = "*";
    this.sourceAverage = "/";
    this.targetRole = "Target Role";
    this.targetMin = "0";
    this.targetMax = "*";
    this.targetAverage = "/";

    this.updateDesc();
}
Relationship.prototype = Object.create(Base.prototype);
Relationship.prototype.constructor = Relationship;

// Methods

Relationship.prototype.getParent_Entity = function () {
    return this.parent;
}

Relationship.prototype.updateDesc = function () {
    var target = this.hasTargetEntity() && typeof this.getTargetEntity() === "object" ? this.targetEntity[0].name : "undefined";
    if (this.isAggregation)
        this.desc = this.name+": "+this.parent.name+"["+target+"] (1:"+this.getTargetCardinality()+")";
    else
        this.desc = this.name+": "+this.parent.name+"=>"+target+" ("+this.getSourceCardinality()+":"+this.getTargetCardinality()+")";

}

Relationship.prototype.hasTargetEntity = function () {
    return this.targetEntity && this.targetEntity.length>0 && this.targetEntity[0]!=null && typeof this.targetEntity[0] === "object" && this.targetEntity[0].constructor !== Array;
}

Relationship.prototype.getTargetEntity = function () {
    return this.targetEntity[0];
}

Relationship.prototype.setTargetEntity = function (te) {
    this.targetEntity = [te];
}

Relationship.prototype.getTargetCardinality = function () {
    if (this.targetAverage === "1") return "1";
    else return parseInt(this.targetAverage) < parseInt(this.getDomain().definitionOfMany) ? "Few":"Many";
}
Relationship.prototype.getSourceCardinality = function () {
    if (this.sourceAverage === "1") return "1";
    else return parseInt(this.sourceAverage) < parseInt(this.getDomain().definitionOfMany) ? "Few":"Many";
}

Relationship.prototype.toJSON = function () {
    var tid = this.hasTargetEntity() ? [this.getTargetEntity().idToJSON()] : [];
    var res = {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        isAggregation: this.isAggregation,
        targetEntity: tid,
        sourceRole: this.sourceRole,
        sourceMin: this.sourceMin,
        sourceMax: this.sourceMax,
        sourceAverage: this.sourceAverage,
        targetRole: this.targetRole,
        targetMin: this.targetMin,
        targetMax: this.targetMax,
        targetAverage: this.targetAverage
    }
    return res;
}

Relationship.prototype.toString = function () {
    var s = this.isAggregation ? ":" : "=>";
    var target = this.hasTargetEntity() ? this.getTargetEntity().name : "undefined";
    return this.name + s + target + (this.targetMax === '*' ? '*' : '');
}

//
// Class "Entity"
//

// Constructor and inheritance

function Entity(domain, id, name, desc, parentClass, isRootEntity, isRootInstance) {
    Base.call(this, "Entity", domain, id, name, desc);
    this.isRootEntity = isRootEntity;
    this.isRootInstance = isRootInstance;
    this.isAbstract = false;
    this.namePlural = name+"s";

    if (isRootEntity) {
        // Create relationship to rootInstance
        newEntity.setRootEntityStatus(true);
    }

    // Inheritance
    this.parentClass = parentClass ? [parentClass] : null;

    // Child elements:
    this.basicProperties = [];
    this.enums = [];
    this.relationships = [];
    this.pageViews = [];
    this.tableViews = [];
}
Entity.prototype = Object.create(Base.prototype);
Entity.prototype.constructor = Entity;

// Methods

Entity.prototype.getParent_Domain = function () {
    return this.parent;
}


Entity.prototype.setRootEntityStatus = function (declareAsRootEntity) {
    if (this.isRootInstance) throw "Can not convert RootInstance to RootEntity!";
    if (!declareAsRootEntity) throw "Currently not supported, sorry - TBD!"
    else {
        if (this.isRootEntity)
            return; // Is already a root instance, ignore...
        var relName = this.namePlural.charAt(0).toUpperCase() + this.namePlural.slice(1);
        var rel = this.getDomain().getRootInstance().addNewRelationship(this, true, relName);
        rel.targetMax = '*';
        this.isRootEntity = true;
    }
}

Entity.prototype.createNewDefaultViews = function () {

    // Create new default page view
    var newDefaultPageView = this.addNewPageView("DefaultPageView", "");
    newDefaultPageView.setAsDefault();

    // First Tab: properties, enums and associations
    var assocs = this.getAssociations();
    var properties = this.getBasicProperties();
    var enums = this.getEnums();
    var basicCount = properties.length + enums.length + assocs.length;
    var hasEnumsAndAssocs = enums.length>0 && assocs.length>0;
    var hasAssocs = assocs.length>0;
    if (basicCount > 0) {
        var pos = 0;
        var item = null;
        var propertyPanel = newDefaultPageView.addNewPanel("Basics", "Properties, Enums and Associations");
        propertyPanel.position=0;
        for (var i in properties) {
            var property = properties[i];
            item = propertyPanel.addNewBasicPropertyPanelItem(property.name, "Tooltip for "+property.name, property);
            item.position = pos++;
        }
        if (hasEnumsAndAssocs) {
            item = propertyPanel.addNewSeparatorPanelItem();
            item.position = pos++;
        }
        for (var i in enums) {
            var enumeration = enums[i];
            item = propertyPanel.addNewEnumPanelItem(enumeration.name, "Tooltip for "+enumeration.name, enumeration);
            item.position = pos++;
        }
        if (hasAssocs) {
            item = propertyPanel.addNewSeparatorPanelItem();
            item.position = pos++;
        }
        for (var i in assocs) {
            item = propertyPanel.addNewRelationshipPanelItem(assocs[i].name, "Tooltip for "+assocs[i].name, assocs[i]);
            item.position = pos++;
        }
    }

    // Next: one tab per relationship
    var aggs = this.getAggregations();
    pos = basicCount > 0 ? 1:0;
    for (var i in aggs) {
        var relationshipPanel = newDefaultPageView.addNewPanel(aggs[i].name, "Tooltip");
        relationshipPanel.position = pos++;
        var panelItem = relationshipPanel.addNewRelationshipPanelItem(aggs[i].name, "Tooltip", aggs[i]);
        panelItem.position = 0;
    }

    // Create new default table view
    var newDefaultTableView = this.addNewTableView("DefaultTableView", "");
    newDefaultTableView.setAsDefault();
    pos = 0;
    for (var i in this.basicProperties) {
        var property = this.basicProperties[i];
        var tableItem = newDefaultTableView.addNewTableItem(property.name, "Tooltip", property);
        tableItem.position = pos++;
    }
}

Entity.prototype.canBeInstantiated = function () {
    if (this.isRootEntity || this.isRootInstance) return true;
    var parrentAggs = this.getAllParentAggregations();
    if (parrentAggs !== null && parrentAggs.length !== 0) return true;
    if (this.hasParentClass()) return this.getParentClass().canBeInstantiated();
    return false;
}

Entity.prototype.createTestInstance = function () {
    var testInstance = {};

    // Basic Properties
    var properties = this.getBasicProperties();
    if (properties && properties.length > 0) {
        properties.forEach(function (property) {
            testInstance[property.name] = property.getTestData();
        });
    }

    // Enums
    var enums = this.getEnums();
    if (enums && enums.length > 0) {
        enums.forEach(function (anEnum) {
            testInstance[anEnum.name] = anEnum.getTestData();
        });
    }
    return testInstance;
}

Entity.prototype.hasParentClass = function () {
    return this.parentClass && this.parentClass.length>0 && this.parentClass[0]!=null;
}

Entity.prototype.getParentClass = function () {
    return this.parentClass[0];
}

Entity.prototype.setParentClass = function (pc) {
    this.parentClass = [pc];
}

Entity.prototype.getBasicProperties = function (ignoreInheritedProperties) {
    if (!ignoreInheritedProperties && this.hasParentClass())
        return this.basicProperties.concat(this.getParentClass().getBasicProperties());
    return this.basicProperties;
}
Entity.prototype.getEnums = function (ignoreInheritedEnums) {
    if (!ignoreInheritedEnums && this.hasParentClass())
        return this.enums.concat(this.getParentClass().getEnums());
    return this.enums;
}

Entity.prototype.getPageViews = function (ignoreInheritedPageViews) {
    if (!ignoreInheritedPageViews && this.hasParentClass())
        return this.pageViews.concat(this.getParentClass().getPageViews());
    return this.pageViews;
}
Entity.prototype.getDefaultPageView = function () {
    for (var idx=0; idx<this.pageViews.length; idx++)
        if (this.pageViews[idx].isDefault)
            return this.pageViews[idx];
    if (this.hasParentClass())
        return this.getParentClass().getDefaulPageViews();
    else
        return null;
}

Entity.prototype.getTableViews= function (ignoreInheritedTableViews) {
    if (!ignoreInheritedTableViews && this.hasParentClass())
        return this.tableViews.concat(this.getParentClass().getTableViews());
    return this.tableViews;
}
Entity.prototype.getDefaultTableView = function () {
    for (var idx=0; idx<this.tableViews.length; idx++)
        if (this.tableViews[idx].isDefault)
            return this.tableViews[idx];
    if (this.hasParentClass())
        return this.getParentClass().getDefaulTableViews();
    else
        return null;
}

Entity.prototype.getRelationships = function (ignoreInheritedRelationships) {
    if (!ignoreInheritedRelationships && this.hasParentClass())
        return this.relationships.concat(this.getParentClass().getRelationships());
    return this.relationships;
}

Entity.prototype.getAggregations = function (ignoreInheritedAggregations) {
    var a = [];
    for (i in this.relationships) if (this.relationships[i].isAggregation) a.push(this.relationships[i]);
    if (!ignoreInheritedAggregations && this.hasParentClass())
        return a.concat(this.getParentClass().getAggregations());
    return a;
}

Entity.prototype.getAssociations = function (ignoreIngeritedAssociations) {
    var a = [];
    for (i in this.relationships) if (!this.relationships[i].isAggregation) a.push(this.relationships[i]);
    if (!ignoreIngeritedAssociations && this.hasParentClass())
        return a.concat(this.getParentClass().getAssociations());
    return a;
}

// TBD: What about multiple levels of inheritance...? (eg C is B, B is A?)
Entity.prototype.getAllDerivedEntities = function () {
    // Return all entities that inherit from this entity
    var domain = this.parent;
    var derivedEntities = [];
    for (var i in domain.entities) {
        var entity = domain.entities[i];
        if (entity.hasParentClass()) {
            var parent = entity.getParentClass();
            if (this.compareToMyID(parent.id)) {
                derivedEntities.push(entity);
            }
        }
    }
    return derivedEntities;
}

// TBD - support inheritance!
Entity.prototype.getAllParentAggregations = function () {
    // Return all aggregations which link to this entity (returns the aggregation, not the parent entity!)
    var domain = this.parent;
    var parentAggs = [];
    var entities = domain.getEntities();
    for (var i in entities) {
        var entity = entities[i];
        var aggRels = entity.getAggregations();
        for (var k in aggRels) {
            var rel = aggRels[k];
            if (rel.hasTargetEntity() && this.compareToMyID(rel.getTargetEntity().id)) {
                parentAggs.push(rel);
            }
        }
    }
    return parentAggs;
}

Entity.prototype.processLocalTemplateFunctions = function (template) {
    var children = [
        // Without parent elements...
        ["BasicProperty", this.getBasicProperties(true)],
        ["Enumeration", this.getEnums(true)],
        ["Relationship", this.getRelationships(true)],
        ["Aggregation", this.getAggregations(true)],
        ["Association", this.getAssociations(true)],
        ["PageView", this.getPageViews(true)],
        ["TableView", this.getTableViews(true)],
        //...and the same *with* parent elements:
        ["BasicProperty!", this.getBasicProperties(false)],
        ["Enumeration!", this.getEnums(false)],
        ["Relationship!", this.getRelationships(false)],
        ["Aggregation!", this.getAggregations(false)],
        ["Association!", this.getAssociations(false)],
        ["PageView!", this.getPageViews(false)],
        ["TableView!", this.getTableViews(false)]
        // Notice that the !-operator can be combined with the ?-operator
        // Example: {{Entity!?}}...{{Entity!}}...{{/Entity!}}...{{/Entity!?}}
    ];

    template = this.processTemplateWithChildElements(template, children);
    return Base.prototype.processLocalTemplateFunctions.call(this, template);
}

Entity.prototype.addNewBasicProperty = function (name, desc, propertyType) {
    var id = this.getDomain().createNewID();
    var newBasicProperty = new BasicProperty(this, id, name, desc, propertyType);
    this.basicProperties.push(newBasicProperty);
    return newBasicProperty;
}

Entity.prototype.addNewEnum = function (name, desc) {
    var id = this.getDomain().createNewID();
    var newEnum = new Enumeration(this, id, name, desc);
    this.enums.push(newEnum);
    return newEnum;
}

Entity.prototype.addNewRelationship = function (target, isAggregation, name) {
    var id = this.getDomain().createNewID();
    if (!name)
        name = target.namePlural;
    var newRelationship = new Relationship(this, target, id, isAggregation, name);
    this.relationships.push(newRelationship);
    return newRelationship;
}

Entity.prototype.addNewPageView = function (name, desc) {
    var hs = this.getHeadStart();
    var id = this.getDomain().createNewID();
    var vf = hs.getViews();
    var newPageView = new vf.PageView(this, id, name, desc);

    this.pageViews.push(newPageView);
    return newPageView;
}

Entity.prototype.addNewTableView = function (name, desc) {
    var hs = this.getHeadStart();
    var id = this.getDomain().createNewID();
    var vf = hs.getViews();
    var newTableView = new vf.TableView(this, id, name, desc);
    this.tableViews.push(newTableView);
    return newTableView;
}

Entity.prototype.getAllElements = function (includeSelf) {
    var r = new Array();
    if (includeSelf)
        r = r.concat(this);
    // Add children with no own children directly:
    r = r.concat(this.relationships);
    r = r.concat(this.basicProperties);
    // Children with children:
    for (i in this.enums)
        r = r.concat(this.enums[i].getAllElements(true));
    for (i in this.pageViews)
        r = r.concat(this.pageViews[i].getAllElements(true));
    for (i in this.tableViews)
        r = r.concat(this.tableViews[i].getAllElements(true));
    return r;
}

Entity.prototype.toString = function (t) {
    var result = "";
    if (!t) return result;

    var name = (this.isRootInstance ? '#' : '') + this.name;

    switch (t) {
        case 'properties':
            result += this.hasParentClass() ? "(" + this.getParentClass().name + ")" : "";
            if (this.enums.length + this.basicProperties.length > 0) result += ": ";
            for (var i in this.basicProperties) result += (i > 0 ? ", " : "") + this.basicProperties[i].toString();
            if (this.enums.length > 0) result += ", ";
            for (var j in this.enums)           result += (j > 0 ? ", " : "") + this.enums[j].toString();
            return name + result;
        case 'aggregations':
            var isFirst = true;
            for (var i in this.relationships) {
                if (this.relationships[i].isAggregation) {
                    var comma = isFirst ? "" : ", ";
                    result += comma + this.relationships[i].toString();
                    isFirst = false;
                }
            }
            return result.length > 0 ? name + ": { " + result + " }" : "";
        case 'associations':
            var isFirst = true;
            for (var i in this.relationships) {
                if (!this.relationships[i].isAggregation) {
                    var comma = isFirst ? "" : ", ";
                    result += comma + this.relationships[i].toString();
                    isFirst = false;
                }
            }
            return result.length > 0 ? name + ": " + result : "";
    }
    throw "Invalid option: " + t;
}

Entity.prototype.toJSON = function () {
    var pc = this.hasParentClass() ? [this.getParentClass().id] : [];

    var bp = [];
    for (i in this.basicProperties) bp.push(this.basicProperties[i].toJSON());

    var e = [];
    for (i in this.enums) e.push(this.enums[i].toJSON());

    var r = [];
    for (i in this.relationships) r.push(this.relationships[i].toJSON());

    var pv = [];
    for (i in this.pageViews) pv.push(this.pageViews[i].toJSON());

    var tv = [];
    for (i in this.tableViews) tv.push(this.tableViews[i].toJSON());

    var res = {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        isRootEntity: this.isRootEntity,
        isRootInstance: this.isRootInstance,
        isAbstract: this.isAbstract,
        namePlural: this.namePlural,
        parentClass: pc,
        basicProperties: bp,
        enums: e,
        relationships: r,
        pageViews: pv,
        tableViews: tv
    };
    return res;
}

//
// Class "Domain"
//

// Constructor and inheritance

function Domain(headstart, name, desc, recreate) {
    // Special case - the parent of domain is headstart, which is not of type "Base"
    this.id_counter = 1;
    Base.call(this, "Domain", headstart, this.id_counter, name, desc);
    this.entities = [];
    this.definitionOfMany = 100;

    // Create rootEntity entity:
    if (!recreate) {
        this.addNewEntity (this.name, "Root for domain " + this.name, null, false, true);
    }
}
Domain.prototype = Object.create(Base.prototype);
Domain.prototype.constructor = Domain;

// Methods

Domain.prototype.save = function () {
    var fn = this.getHeadStart().getDir("domains") + this.name + ".jsn";
    var fs = require('fs');
    fs.writeFileSync(fn, JSON.stringify(this, null, 2));
}

Domain.prototype.createNewID = function () {
    if (this.id_counter < 2) {
        var max = 1;
        var all = this.getAllElements();
        for (i in all) if (all[i].id > max) max = all[i].id;
        this.id_counter = max + 1;
    }
    return this.id_counter++;
}

Domain.prototype.compareIDs = function (id1, id2) {
    return id1.toString() === id2.toString();
}

Domain.prototype.validateModel = function () {
    var vRes = "";
    var wCount = 0;

    if (this.name === "New_Domain") {
        wCount++;
        vRes += "<br>["+wCount+"]: <strong>" + this.name + "</strong> is not a unique name - please rename your Domain!";
    }

    // All Relationships need targets
    for (var i in this.entities) {
        for (var j in this.entities[i].relationships) {
            var rel = this.entities[i].relationships[j];
            var rn = rel.name;
            var t = this.entities[i].relationships[j].getTargetEntity();
            var rn = t.name;
            if (!this.entities[i].relationships[j].hasTargetEntity()) {
                wCount++;
                vRes += "<br>["+wCount+"]: <strong>" + this.entities[i].name + "::" + this.entities[i].relationships[j].name + "</strong> does not have a target!";
            }
        }
    }

    // All entities should either be root entity or aggregated by another entity (directly or through inheritance):
    for (var i in this.entities) {
        if (!this.entities[i].canBeInstantiated()) {
            wCount++;
            vRes += "<br>[" + wCount + "]: <strong>" + this.entities[i].name + "</strong> can not be instantiated (solution: make it a RootEntity or child of another entity)";
        }
    }

    if (wCount === 0) return null;
    return wCount === 1 ? "<strong>1 Warning:</strong>"+vRes : "<strong>"+wCount+" Warnings:</strong>"+vRes;
}

Domain.prototype.getEntities = function (sortByInheritance) {
    if (!sortByInheritance)
        return this.entities;
    for (i in this.entities) {
        var entity = this.entities[i];
        entity.longName = entity.name;
        var tmpEntity = entity;
        while (tmpEntity.hasParentClass()) {
            tmpEntity = tmpEntity.getParentClass();
            entity.longName = tmpEntity.name+":"+entity.longName;
        }
    }
    return this.entities.sort (function (a, b) {
        if (a.longName<b.longName) return -1;
        if (a.longName>b.longName) return 1;
        return 0;
    });
}

Domain.prototype.getRootEntities = function () {
    var allEntities = this.entities;
    var rootEntities = [];
    for (var i in allEntities)
        if (allEntities[i].isRootEntity)
            rootEntities.push(allEntities[i]);
    return allEntities;
}

Domain.prototype.getRootInstance = function () {
    var allEntities = this.entities;
    for (var i in allEntities)
        if (allEntities[i].isRootInstance)
            return allEntities[i];
    throw "Domain without root instance!"
}


Domain.prototype.addEntity = function (newEntity) {
    return this.entities.push(newEntity);
}

Domain.prototype.addNewEntity = function (name, desc, parentClass, isRootEntity, isRootInstance) {
    var id = this.getDomain().createNewID();
    var newEntity = new Entity(this, id, name, desc, parentClass, isRootEntity, isRootInstance);

    this.addEntity(newEntity);
    return newEntity;
}

Domain.prototype.createNewDefaultViews = function () {
    this.getEntities().forEach(function (elem) {
        elem.createNewDefaultViews();
    });
}

Domain.prototype.getAllElements = function (includeSelf) {
    // Returns an array containing all child elements; optional: also include self
    var r = new Array();
    if (includeSelf)
        r = r.concat(this);
    for (i in this.getEntities())
        r = r.concat(this.getEntities()[i].getAllElements(true));
    return r;
}

Domain.prototype.createTestDataForEntity = function (entityDef, relationship, parentInstance) {
    // TBD1: Change algorithm to  create as many entities as possible with one DB insert
    // TBD2: Leverage cardinality to "embedd" child objects with low cardinality into the parent document

    var testData = entityDef.createTestInstance();
    if (parentInstance) {
        testData.parentID = parentInstance;
        testData.parentRelnID = relationship.id;
        testData.parentRelnName = relationship.name; // TBD: For debugging - remove later
    }
    else {
        testData.isRootInstance = true;
        testData.parentID = null;
        testData.parentRelID = null;
    }
    testData.type = entityDef.name;
    // TBD: TEST - var ObjectID = require("mongodb").ObjectID;
    // testData._id = new ObjectID().toString();

    var domain = this;
    this.getHeadStart().useDB(domain.name, function (db) {
        var collection = db.collection(entityDef.name);
        collection.insertOne(testData, function (mongoErr, mongoRes) {
            if (mongoErr) {
                console.log("Error creating test data: " + mongoErr);
            }
            else {
                var aggs = entityDef.getAggregations();
                if (aggs) aggs.forEach(function (rel) {
                    var avg = rel.targetAverage;
                    for (var i = 0; i < avg; i++)
                        domain.createTestDataForEntity(rel.getTargetEntity(), rel, mongoRes.ops[0]._id);
                });
            }
        });
    });
}


Domain.prototype.processLocalTemplateFunctions = function (template) {
    var children = [["Entity", this.getEntities(true)]];
    template = this.processTemplateWithChildElements(template, children);
    return Base.prototype.processLocalTemplateFunctions.call(this, template);
}

Domain.prototype.toJSON = function () {
    var e = [];
    for (i in this.getEntities()) e.push(this.getEntities()[i].toJSON());
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        definitionOfMany: this.definitionOfMany,
        entities: e
    };
}

Domain.prototype.toString = function () {
    var s = "//\n// Domain '" + this.name + "'\n//\n";

    s += "\n// Basic Entity Definitions:\n";
    for (i in this.getEntities()) {
        var e = this.getEntities()[i];
        s += e.toString("properties") + "\n";
    }

    s += "\n// Aggregation Hierarchy:\n";
    for (i in this.getEntities()) {
        var e = this.getEntities()[i];
        var es = e.toString("aggregations");
        if (es.length > 0)
            s += es + "\n";
    }

    s += "\n// Associations:\n";
    for (i in this.getEntities()) {
        var e = this.getEntities()[i];
        var es = e.toString("associations");
        if (es.length > 0)
            s += es + "\n";
    }

    return s;
}

Domain.prototype.getFileName = function (folder) {
    var f = folder ? folder + "\\" : "";
    var fn = '.\\generated\\' + f + this.name + '.html';
    return fn;
}

//
// ------------------------------------------------------------------------------------------------------------
// Export modules
// ------------------------------------------------------------------------------------------------------------
//

// Functions:
exports.Base = Base;
exports.Domain = Domain;
exports.Entity = Entity;
exports.BasicProperty = BasicProperty;
exports.Enumeration = Enumeration;
exports.Literal = Literal;
exports.Relationship = Relationship;
