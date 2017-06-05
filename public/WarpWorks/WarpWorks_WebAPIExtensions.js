//
// Extensions for Class "Enumeration"
//

Enumeration.prototype.toString = function() {
    var s = "";
    var isFirst = true;
    for (i in this.literals) {
        var comma = isFirst ? "" : ", ";
        isFirst = false;
        s += comma + this.literals[i].name;
    }
    return s;
};

//
// Extensions for Class "Entity"
//

// TBD: all "get...()"-classes need to support inheritance (optional)...

Entity.prototype.isDocument = function() {
    return this.entityType === "Document";
};

Entity.prototype.hasParentClass = function() {
    return this.parentClass && this.parentClass.length > 0 && this.parentClass[0] != null;
};

Entity.prototype.getParentClass = function() {
    return this.parentClass[0];
};

Entity.prototype.setParentClass = function(pc) {
    this.parentClass = [pc];
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

Entity.prototype.getAggregations = function(sort) {
    var res = [];
    this.relationships.forEach(function(relation) {
        if (relation.isAggregation) {
            res.push(relation);
        }
    });
    if (sort) {
        return this.parent.sortElements(res);
    } else {
        return res;
    }
};

Entity.prototype.getBasicProperties = function(sort) {
    if (sort) {
        return this.parent.sortElements(this.basicProperties);
    } else {
        return this.basicProperties;
    }
};

Entity.prototype.getEnums = function(sort) {
    if (sort) {
        return this.parent.sortElements(this.enums);
    } else {
        return this.enums;
    }
};

Entity.prototype.getViews = function(sort) {
    var views = this.tableViews.concat(this.pageViews);
    if (sort) {
        return this.parent.sortElements(views);
    } else {
        return views;
    }
};

Entity.prototype.getAssociations = function(sort) {
    var res = [];
    this.relationships.forEach(function(relation) {
        if (!relation.isAggregation) {
            res.push(relation);
        }
    });
    if (sort) {
        return this.parent.sortElements(res);
    } else {
        return res;
    }
};

Entity.prototype.getRelationships = function(sort) {
    var res = this.relationships;
    if (sort) {
        return this.parent.sortElements(res);
    } else {
        return res;
    }
};

Entity.prototype.getPageViews = function(sort) {
    if (sort) {
        return this.parent.sortElements(this.pageViews);
    } else {
        return this.pageViews;
    }
};

Entity.prototype.getTableViews = function(sort) {
    if (sort) {
        return this.parent.sortElements(this.tableViews);
    } else {
        return this.tableViews;
    }
};

Entity.prototype.getAllDerivedEntities = function(sort) {
    var domain = this.parent;
    var derivedEntities = [];
    for (var i in domain.entities) {
        var entity = domain.entities[i];
        if (entity.hasParentClass()) {
            var parent = entity.getParentClass();
            if (this.compareToMyID(parent.id)) {
                // console.log("Match: "+rel.parent.name+" is parent of "+this.name);
                derivedEntities.push(entity);
            }
        }
    }
    if (sort) {
        return this.parent.sortElements(derivedEntities);
    } else {
        return derivedEntities;
    }
};

Entity.prototype.getAllParentAggregations = function(sort) {
    var domain = this.parent;
    var parentAggs = [];
    for (var i in domain.entities) {
        var entity = domain.entities[i]; // TBD: Check - on the server side, this is using getEntities() to also include the rootEntity element - potential problem?
        var aggRels = entity.getAggregations();
        for (var k in aggRels) {
            var rel = aggRels[k];
            if (rel.hasTargetEntity() && this.compareToMyID(rel.getTargetEntity().id)) {
                parentAggs.push(rel);
            }
        }
    }
    if (sort) {
        return this.parent.sortElements(parentAggs);
    } else {
        return parentAggs;
    }
};

var aggCounter = 0;
Entity.prototype.updateQuantityData = function() {
    if (this.quantity) {
        return this.quantity;
    }

    if (this.isRootInstance) {
        this.quantity = 1;
        return this.quantity;
    }

    if (++aggCounter > 500) { // TBD: Handle cyclic aggregation graphs
        throw "Suspecting cyclic reference - currently not able to handle this, sorry!";
    }

    this.quantity = 0;
    var parentAggs = this.getAllParentAggregations();
    for (var i in parentAggs) {
        var rel = parentAggs[i];
        var parentQty = rel.parent.updateQuantityData();
        var targetAvg = isNaN(rel.targetAverage) ? 0 : rel.targetAverage;
        this.quantity += targetAvg * parentQty;
    }
    return this.quantity;
};

//
// Extensions for Class "Domain"
//

Domain.prototype.createNewID = function() {
    if (this.id_counter < 2) {
        var max = 1;
        var all = this.getAllElements();
        for (i in all) {
            if (all[i].id > max) {
                max = all[i].id;
            }
        }
        this.id_counter = max + 1;
    }
    return this.id_counter++;
};

Domain.prototype.sortElements = function(entities) {
    return entities.sort(function(a, b) {
        if (a.isRootInstance && a.isRootInstance === true) {
            return -1;
        }
        if (b.isRootInstance && b.isRootInstance === true) {
            return 1;
        }
        if (a.name === b.name) {
            return 0;
        }
        return a.name > b.name ? 1 : -1;
    });
};

Domain.prototype.getEntities = function(sort) {
    if (sort) {
        return this.sortElements(this.entities);
    } else {
        return this.entities;
    }
};

Domain.prototype.getRootInstance = function() {
    var allEntities = this.entities;
    for (var i in allEntities) {
        if (allEntities[i].isRootInstance) {
            return allEntities[i];
        }
    }
    throw "Domain without root instance!";
};

Domain.prototype.getRootEntities = function(sort) {
    var rootEntities = [];
    for (i in this.entities) {
        if (this.entities[i].isRootEntity) {
            rootEntities.push(this.entities[i]);
        }
    }
    if (sort) {
        return this.sortElements(rootEntities);
    } else {
        return rootEntities;
    }
};

Domain.prototype.getRoot = function() {
    var root = [];
    for (i in this.entities) {
        if (this.entities[i].isRootInstance) {
            root.push(this.entities[i]);
        }
    }
    if (root.length != 1) {
        throw "Domain must have exactly one rootEntity, not " + root.length;
    }
    return root[0];
};

Domain.prototype.updateQuantityData = function() {
    var cnt = 0;
    for (var i in this.entities) {
        this.entities[i].quantity = null;
    }
    for (var i in this.entities) {
        cnt += $active.domain.entities[i].updateQuantityData();
    }
    return cnt;
};

Domain.prototype.setDefaultAverages = function(avg) {
    for (var i in this.entities) {
        var entity = this.entities[i];
        for (var j in entity.relationships) {
            var max = parseInt("" + entity.relationships[j].targetMax);
            entity.relationships[j].targetAverage = max > avg ? max : avg;
            console.log("Setting avg: " + entity.relationships[j].name);
        }
    }
};

//
// Extensions for Class "Relationship"
//

Relationship.prototype.hasTargetEntity = function() {
    return this.targetEntity && this.targetEntity.length > 0 && this.targetEntity[0] != null;
};

Relationship.prototype.getTargetEntity = function() {
    return this.targetEntity[0];
};

Relationship.prototype.setTargetEntity = function(te) {
    this.targetEntity = [te];
};

Relationship.prototype.updateDesc = function() {
    var target = this.hasTargetEntity() && typeof this.getTargetEntity() === "object" ? this.targetEntity[0].name : "undefined";
    if (this.isAggregation) {
        this.desc = this.name + ": " + this.parent.name + "[" + target + "] (1:" + this.getTargetCardinality() + ")";
    } else {
        this.desc = this.name + ": " + this.parent.name + "=>" + target + " (" + this.getSourceCardinality() + ":" + this.getTargetCardinality() + ")";
    }
};

Relationship.prototype.getTargetCardinality = function() {
    if (this.targetAverage === "1") {
        return "1";
    } else {
        return parseInt(this.targetAverage) < parseInt(this.getDomain().definitionOfMany) ? "Few" : "Many";
    }
};
Relationship.prototype.getSourceCardinality = function() {
    if (this.sourceAverage === "1") {
        return "1";
    } else {
        return parseInt(this.sourceAverage) < parseInt(this.getDomain().definitionOfMany) ? "Few" : "Many";
    }
};

// ---------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------

//
// Extensions for Class "TableItem"
//

TableItem.prototype.hasProperty = function() {
    return this.property && this.property.length > 0 && this.property[0] != null;
};

TableItem.prototype.getProperty = function() {
    return this.property[0];
};

TableItem.prototype.setProperty = function(p) {
    this.property = [p];
};

//
// Extensions for Class "RelationshipPanelItem"
//

RelationshipPanelItem.prototype.hasRelationship = function() {
    return this.relationship && this.relationship.length > 0 && this.relationship[0] != null;
};

RelationshipPanelItem.prototype.getRelationship = function() {
    return this.relationship[0];
};

RelationshipPanelItem.prototype.setRelationship = function(r) {
    this.relationship = [r];
};

RelationshipPanelItem.prototype.hasView = function() {
    return this.view && this.view.length > 0 && this.view[0] != null;
};

RelationshipPanelItem.prototype.getView = function() {
    return this.view[0];
};

RelationshipPanelItem.prototype.setView = function(r) {
    this.view = [r];
};

//
// Extensions for Class "BasicPropertyPanelItem"
//

BasicPropertyPanelItem.prototype.hasBasicProperty = function() {
    return this.basicProperty && this.basicProperty.length > 0 && this.basicProperty[0] != null;
};

BasicPropertyPanelItem.prototype.getBasicProperty = function() {
    return this.basicProperty[0];
};

BasicPropertyPanelItem.prototype.setBasicProperty = function(bp) {
    this.basicProperty = [bp];
};

//
// Extensions for Class "EnumPanelItem"
//

EnumPanelItem.prototype.hasEnumeration = function() {
    return this.enumeration && this.enumeration.length > 0 && this.enumeration[0] != null;
};

EnumPanelItem.prototype.getEnumeration = function() {
    return this.enumeration[0];
};

EnumPanelItem.prototype.setEnumeration = function(e) {
    this.enumeration = [e];
};

//
// Extensions for Class "PageView"
//

PageView.prototype.getPanels = function(sort) {
    if (sort) {
        return hsSortByPosition(this.panels);
    } else {
        return this.panels;
    }
};

//
// Extensions for Class "Panel"
//

Panel.prototype.getAllPanelItems = function(sortByPosition) {
    var res = [];
    res = res.concat(this.separatorPanelItems);
    res = res.concat(this.relationshipPanelItems);
    res = res.concat(this.basicPropertyPanelItems);
    res = res.concat(this.enumPanelItems);

    if (!sortByPosition) {
        return res;
    } else {
        return hsSortByPosition(res);
    }
};

Panel.prototype.nextPanelItemPosition = function() {
    var max = -1;
    var panelItems = this.getAllPanelItems();
    for (i in panelItems) {
        var cPos = Number(panelItems[i].position);
        if (cPos > max) {
            max = cPos;
        }
    }
    return max + 1;
};

// ---------------------------------------------------------------------
// Misc Utilities
// ---------------------------------------------------------------------

hsGetURLParam = function(argName) {
    var urlSearch = window.location.search;
    var arg = urlSearch.split(argName + "=");
    if (arg.length < 2) {
        return null;
    }
    return arg[1].split("&")[0];
};

hsCompareIDs = function(id1, id2) {
    return "" + id1 === "" + id2;
};

hsSortByPosition = function(arr) {
    return arr.sort(function(a, b) {
        a = Number(a.position);
        b = Number(b.position);
        if (a === b) {
            return 0;
        }
        return a > b ? 1 : -1;
    });
};
