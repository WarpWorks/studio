const Base = require('./base');
const BasicProperty = require('./basic-property');
const Enumeration = require('./enumeration');
const Relationship = require('./relationship');
const views = require('./views');

//
// Class "Entity"
//

// Constructor and inheritance

function Entity(domain, id, name, desc, parentClass, isRootEntity, isRootInstance) {
    Base.call(this, "Entity", domain, id, name, desc);
    this.isRootEntity = isRootEntity;
    this.isRootInstance = isRootInstance;
    this.isAbstract = false;
    this.namePlural = name + "s";

    if (isRootEntity) {
        // Create relationship to rootInstance
        this.setRootEntityStatus(true);
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

Entity.prototype.getParent_Domain = function() {
    return this.parent;
};

Entity.prototype.setRootEntityStatus = function(declareAsRootEntity) {
    if (this.isRootInstance) {
        throw new Error("Can not convert RootInstance to RootEntity!");
    } else if (!declareAsRootEntity) {
        throw new Error("Currently not supported, sorry - TBD!");
    } else {
        if (this.isRootEntity) {
            return;
        } // Is already a root instance, ignore...
        var relName = this.namePlural.charAt(0).toUpperCase() + this.namePlural.slice(1);
        var rel = this.getDomain().getRootInstance().addNewRelationship(this, true, relName);
        rel.targetMax = '*';
        this.isRootEntity = true;
    }
};

Entity.prototype.createNewDefaultViews = function () {
    this.createNewDefaultTableView();
    this.createNewDefaultPageView();
    this.createNewDefaultPortalView();
};

Entity.prototype.createNewDefaultTableView = function () {
    // Create new default table view
    var newDefaultTableView = this.addNewTableView("DefaultTableView", "");
    newDefaultTableView.setAsDefault();
    var pos = 0;
    var properties = this.getBasicProperties();
    for (var i in properties) {
        var property = properties[i];
        var tableItem = newDefaultTableView.addNewTableItem(property.name, "Tooltip", property);
        tableItem.position = pos++;
    }
};

Entity.property.createNewDefaultPortalView = function() {
    // Create new default page view
    var newDefaultPageView = this.addNewPageView("DefaultPortalView", "");

    // First Tab: properties, enums and associations
    var assocs = this.getAssociations();
    var properties = this.getBasicProperties();
    var enums = this.getEnums();
    var aggs = this.getAggregations();
    var basicCount = properties.length + enums.length + assocs.length + aggs.length;
    var createdAtLeastOne = false;
    if (basicCount > 0) {
        var pos = 0;
        var item = null;
        var panel = newDefaultPageView.addNewPanel("Basics", "Properties, Enums, Associations and Aggregations");
        panel.position = 0;
        for (var i in properties) {
            var property = properties[i];
            item = panel.addNewBasicPropertyPanelItem(property.name, "Tooltip for " + property.name, property);
            item.position = pos++;
        }
        createdAtLeastOne = properties.length>0;
        if (createdAtLeastOne && enums.length>0) {
            item = panel.addNewSeparatorPanelItem();
            item.position = pos++;
        }
        for (var i in enums) {
            var enumeration = enums[i];
            item = panel.addNewEnumPanelItem(enumeration.name, "Tooltip for " + enumeration.name, enumeration);
            item.position = pos++;
        }
        createdAtLeastOne = createdAtLeastOne || enums.length>0;
        if (createdAtLeastOne && assocs.length>2) {
            item = panel.addNewSeparatorPanelItem();
            item.position = pos++;
        }
        for (var i in assocs) {
            var assoc = assocs[i];
            if (assoc.name!="ReadAccess" && assoc.name!="WriteAccess") {
                item = panel.addNewRelationshipPanelItem(assoc.name, "Tooltip for " + assocs[i].name, assocs[i]);
                item.style = "CSV";
                item.position = pos++;
            }
        }
        createdAtLeastOne = createdAtLeastOne || assocs.length>0;
        if (createdAtLeastOne && aggs.length>1) {
            item = panel.addNewSeparatorPanelItem();
            item.position = pos++;
        }
        for (var i in aggs) {
            var agg = aggs[i];
            if (agg.name!="Overview") {
                var item = panel.addNewRelationshipPanelItem(agg.name, "Tooltip", aggs[i]);
                item.style = "CSV";
                item.position = pos++;
            }
        }
    }
};

Entity.prototype.createNewDefaultPageView = function () {
    // Create new default page view
    var newDefaultPageView = this.addNewPageView("DefaultPageView", "");
    newDefaultPageView.setAsDefault();

    // First Tab: properties, enums and associations
    var assocs = this.getAssociations();
    var properties = this.getBasicProperties();
    var enums = this.getEnums();
    var basicCount = properties.length + enums.length + assocs.length;
    var createdAtLeastOne = false;
    if (basicCount > 0) {
        var pos = 0;
        var item = null;
        var propertyPanel = newDefaultPageView.addNewPanel("Basics", "Properties, Enums and Associations");
        propertyPanel.position = 0;
        for (i in properties) {
            property = properties[i];
            item = propertyPanel.addNewBasicPropertyPanelItem(property.name, "Tooltip for " + property.name, property);
            item.position = pos++;
        }
        createdAtLeastOne = properties.length > 0;
        if (createdAtLeastOne && enums.length) {
            item = propertyPanel.addNewSeparatorPanelItem();
            item.position = pos++;
        }
        createdAtLeastOne = createdAtLeastOne || enums.length > 0;
        for (i in enums) {
            var enumeration = enums[i];
            item = propertyPanel.addNewEnumPanelItem(enumeration.name, "Tooltip for " + enumeration.name, enumeration);
            item.position = pos++;
        }
        if (createdAtLeastOne && assocs.length) {
            item = propertyPanel.addNewSeparatorPanelItem();
            item.position = pos++;
            createdAtLeastOne = true;
        }
        for (i in assocs) {
            item = propertyPanel.addNewRelationshipPanelItem(assocs[i].name, "Tooltip for " + assocs[i].name, assocs[i]);
            item.style = 'CSV';
            item.position = pos++;
        }
    }

    // Next: one tab per relationship
    var aggs = this.getAggregations();
    pos = basicCount > 0 ? 1 : 0;
    for (i in aggs) {
        var relationshipPanel = newDefaultPageView.addNewPanel(aggs[i].name, "Tooltip");
        relationshipPanel.position = pos++;
        var item = relationshipPanel.addNewRelationshipPanelItem(aggs[i].name, "Tooltip", aggs[i]);
        item.style = "Table";
        item.position = 0;
    }
};

Entity.prototype.canBeInstantiated = function() {
    if (this.isRootEntity || this.isRootInstance) {
        return true;
    }
    var parrentAggs = this.getAllParentAggregations();
    if (parrentAggs !== null && parrentAggs.length !== 0) {
        return true;
    }
    if (this.hasParentClass()) {
        return this.getParentClass().canBeInstantiated();
    }
    return false;
};

Entity.prototype.createTestInstance = function() {
    var testInstance = {};
    testInstance.type = this.name;

    // Basic Properties
    var properties = this.getBasicProperties();
    if (properties && properties.length > 0) {
        properties.forEach(function(property) {
            testInstance[property.name] = property.getTestData();
        });
    }

    // Enums
    var enums = this.getEnums();
    if (enums && enums.length > 0) {
        enums.forEach(function(anEnum) {
            testInstance[anEnum.name] = anEnum.getTestData();
        });
    }
    return testInstance;
};

Entity.prototype.hasParentClass = function() {
    return this.parentClass && this.parentClass.length > 0 && this.parentClass[0] != null;
};

Entity.prototype.getParentClass = function() {
    return this.parentClass[0];
};

Entity.prototype.getBaseClass = function() {
    // BaseClass = Topmost, non-abstract class in the inheritance hierarchy
    var res = this;
    while (res.hasParentClass() && !res.getParentClass().isAbstract) {
        res = res.getParentClass();
    }
    if (res.isAbstract) {
        return null;
    }
    return res;
};

Entity.prototype.setParentClass = function(pc) {
    this.parentClass = [pc];
};

Entity.prototype.getBasicProperties = function(ignoreInheritedProperties) {
    if (!ignoreInheritedProperties && this.hasParentClass()) {
        return this.getParentClass().getBasicProperties().concat(this.basicProperties);
    }
    return this.basicProperties;
};
Entity.prototype.getEnums = function(ignoreInheritedEnums) {
    if (!ignoreInheritedEnums && this.hasParentClass()) {
        return this.getParentClass().getEnums().concat(this.enums);
    }
    return this.enums;
};

Entity.prototype.getPageViews = function(ignoreInheritedPageViews) {
    if (!ignoreInheritedPageViews && this.hasParentClass()) {
        return this.getParentClass().getPageViews().concat(this.pageViews);
    }
    return this.pageViews;
};
Entity.prototype.getDefaultPageView = function() {
    for (var idx = 0; idx < this.pageViews.length; idx++) {
        if (this.pageViews[idx].isDefault) {
            return this.pageViews[idx];
        }
    }
    if (this.hasParentClass()) {
        return this.getParentClass().getDefaulPageViews();
    } else {
        return null;
    }
};

Entity.prototype.getTableViews = function(ignoreInheritedTableViews) {
    if (!ignoreInheritedTableViews && this.hasParentClass()) {
        return this.getParentClass().getTableViews().concat(this.tableViews);
    }
    return this.tableViews;
};
Entity.prototype.getDefaultTableView = function() {
    for (var idx = 0; idx < this.tableViews.length; idx++) {
        if (this.tableViews[idx].isDefault) {
            return this.tableViews[idx];
        }
    }
    if (this.hasParentClass()) {
        return this.getParentClass().getDefaulTableViews();
    } else {
        return null;
    }
};

Entity.prototype.getRelationships = function(ignoreInheritedRelationships) {
    if (!ignoreInheritedRelationships && this.hasParentClass()) {
        return this.getParentClass().getRelationships().concat(this.relationships);
    }
    return this.relationships;
};

Entity.prototype.getAggregations = function(ignoreInheritedAggregations) {
    var i;
    var a = [];
    for (i in this.relationships) {
        if (this.relationships[i].isAggregation) {
            a.push(this.relationships[i]);
        }
    }
    if (!ignoreInheritedAggregations && this.hasParentClass()) {
        return this.getParentClass().getAggregations().concat(a);
    }
    return a;
};

Entity.prototype.getAssociations = function(ignoreIngeritedAssociations) {
    var i;
    var a = [];
    for (i in this.relationships) {
        if (!this.relationships[i].isAggregation) {
            a.push(this.relationships[i]);
        }
    }
    if (!ignoreIngeritedAssociations && this.hasParentClass()) {
        return this.getParentClass().getAssociations().concat(a);
    }
    return a;
};

// TBD: What about multiple levels of inheritance...? (eg C is B, B is A?)
Entity.prototype.getAllDerivedEntities = function() {
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
};

// TBD - support inheritance!
Entity.prototype.getAllParentAggregations = function() {
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
};

Entity.prototype.processLocalTemplateFunctions = function(template) {
    var children = [
        // Without parent elements...
        ["BasicProperty", this.getBasicProperties(true)],
        ["Enumeration", this.getEnums(true)],
        ["Relationship", this.getRelationships(true)],
        ["Aggregation", this.getAggregations(true)],
        ["Association", this.getAssociations(true)],
        ["PageView", this.getPageViews(true)],
        ["TableView", this.getTableViews(true)],
        // ...and the same *with* parent elements:
        ["BasicProperty!", this.getBasicProperties(false)],
        ["Enumeration!", this.getEnums(false)],
        ["Relationship!", this.getRelationships(false)],
        ["Aggregation!", this.getAggregations(false)],
        ["Association!", this.getAssociations(false)],
        ["PageView!", this.getPageViews(false)],
        ["TableView!", this.getTableViews(false)]
        // Notice that the !-operator can be combined with the ?-operator
        // Example: {{Enumeration!?}}...{{Enumeration!}}...{{/Enumeration!}}...{{/Enumeration!?}}
    ];

    template = this.processTemplateWithChildElements(template, children);
    return Base.prototype.processLocalTemplateFunctions.call(this, template);
};

Entity.prototype.addNewBasicProperty = function(name, desc, propertyType) {
    var id = this.getDomain().createNewID();
    var newBasicProperty = new BasicProperty(this, id, name, desc, propertyType);
    this.basicProperties.push(newBasicProperty);
    return newBasicProperty;
};

Entity.prototype.addNewEnum = function(name, desc) {
    var id = this.getDomain().createNewID();
    var newEnum = new Enumeration(this, id, name, desc);
    this.enums.push(newEnum);
    return newEnum;
};

Entity.prototype.addNewRelationship = function(target, isAggregation, name) {
    var id = this.getDomain().createNewID();
    if (!name) {
        name = target.namePlural;
    }
    var newRelationship = new Relationship(this, target, id, isAggregation, name);
    this.relationships.push(newRelationship);
    return newRelationship;
};

Entity.prototype.addNewPageView = function(name, desc) {
    var id = this.getDomain().createNewID();
    var newPageView = new views.PageView(this, id, name, desc);

    this.pageViews.push(newPageView);
    return newPageView;
};

Entity.prototype.addNewTableView = function(name, desc) {
    var id = this.getDomain().createNewID();
    var newTableView = new views.TableView(this, id, name, desc);
    this.tableViews.push(newTableView);
    return newTableView;
};

Entity.prototype.getAllElements = function(includeSelf) {
    var i;
    var r = [];
    if (includeSelf) {
        r = r.concat(this);
    }
    // Add children with no own children directly:
    r = r.concat(this.relationships);
    r = r.concat(this.basicProperties);
    // Children with children:
    for (i in this.enums) {
        r = r.concat(this.enums[i].getAllElements(true));
    }
    for (i in this.pageViews) {
        r = r.concat(this.pageViews[i].getAllElements(true));
    }
    for (i in this.tableViews) {
        r = r.concat(this.tableViews[i].getAllElements(true));
    }
    return r;
};

Entity.prototype.toString = function(t) {
    var comma;
    var i;
    var isFirst;
    var j;
    var result = "";
    if (!t) {
        return result;
    }

    var name = (this.isRootInstance ? '#' : '') + this.name;

    switch (t) {
        case 'properties':
            result += this.hasParentClass() ? "(" + this.getParentClass().name + ")" : "";
            if (this.enums.length + this.basicProperties.length > 0) {
                result += ": ";
            }
            for (i in this.basicProperties) {
                result += (i > 0 ? ", " : "") + this.basicProperties[i].toString();
            }
            if (this.enums.length > 0) {
                result += ", ";
            }
            for (j in this.enums) {
                result += (j > 0 ? ", " : "") + this.enums[j].toString();
            }
            return name + result;
        case 'aggregations':
            isFirst = true;
            for (i in this.relationships) {
                if (this.relationships[i].isAggregation) {
                    comma = isFirst ? "" : ", ";
                    result += comma + this.relationships[i].toString();
                    isFirst = false;
                }
            }
            return result.length > 0 ? name + ": { " + result + " }" : "";
        case 'associations':
            isFirst = true;
            for (i in this.relationships) {
                if (!this.relationships[i].isAggregation) {
                    comma = isFirst ? "" : ", ";
                    result += comma + this.relationships[i].toString();
                    isFirst = false;
                }
            }
            return result.length > 0 ? name + ": " + result : "";
    }
    throw new Error("Invalid option: " + t);
};

Entity.prototype.toJSON = function() {
    var i;
    var pc = this.hasParentClass() ? [this.getParentClass().id] : [];

    var bp = [];
    for (i in this.basicProperties) {
        bp.push(this.basicProperties[i].toJSON());
    }

    var e = [];
    for (i in this.enums) {
        e.push(this.enums[i].toJSON());
    }

    var r = [];
    for (i in this.relationships) {
        r.push(this.relationships[i].toJSON());
    }

    var pv = [];
    for (i in this.pageViews) {
        pv.push(this.pageViews[i].toJSON());
    }

    var tv = [];
    for (i in this.tableViews) {
        tv.push(this.tableViews[i].toJSON());
    }

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
};

