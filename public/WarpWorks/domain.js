// --------------------------------------------------------------------------------
//                           Initialize / Update Page
// --------------------------------------------------------------------------------
var $active = {};
$active.domain = null;

$(document).ready(function() {
    $('#warningsA').click(showWarnings);
    $('#addEntityA').click(addNewEntity);
    $('#parentEntitySelector').click(selectTargetEntityForInheritance);
    $('#rootEntityMakeRootA').click(makeRootEntity);
    $('#removeEntityB').click(removeEntity);
    $('#removePropertyB').click(removeProperty);
    $('#parentEntityNPitem').click(enumEditLiterals);
    $('#removeEnumB').click(removeEnum);
    $('#aggregationTargetNameItem').click(selectTargetEntityForAggregation);
    $('#removeAggregationB').click(removeAggregation);
    $('#associationTagetIcon').click(selectTargetEntityForAssociation);
    $('#removeAssociationB').click(removeAssociation);
    $('#createDefaultViewsB').click(createDefaultViews);

    $('#entityNameI').change(entityNameChanged);
    $('#propertyNameI').change(propertyNameChanged);
    $('#enumNameI').change(enumNameChanged);
    $('#aggregationNameI').change(aggregationNameChanged);
    $('#aggregationTargetAvgI').change(aggregationAverageChanged);
    $('#associationNameI').change(associationNameChanged);
    $('#associationTargetAvgI').change(associationAverageChanged);

    $.ajax({
        method: 'GET',
        headers: {
            accept: 'application/hal+json'
        },
        success: function(result) {
            $active.domain = result.domain;
            $active._links = result._links;
            loadDomainOverview();
        },
        error: function(err) {
            console.log("INITIAL: err=", err);
        }
    });
});

function loadDomainOverview(domArg) {
    var domain = domArg || window.location.pathname.split('/').pop();

    if (domain === "New_Domain") {
        $active.domain = warp().addNew_Domain("New_Domain", "");
        var rootInstance = $active.domain.addNew_Entity("MyDomain", "");
        rootInstance.isRootEntity = true;
        rootInstance.isRootInstance = true;

        updateActiveDomain();
    } else {
        getDomainData(function() {
            updateActiveDomain();
        });
    }
}

// --------------------------------------------------------------------------------
//                       Update Active Domain: Create Entity List
// --------------------------------------------------------------------------------

function updateActiveDomain(activeEntityArg) {
    // Set domain name
    updateMyNavBar();

    // Clean up entity list
    $("#entityOverviewNP").empty();

    // Get sorted list of Entities
    var sortedEntityList = $active.domain.getEntities(true);

    // Which is the active entity?
    var activeEntity = null;
    if (activeEntityArg) {
        activeEntity = activeEntityArg;
    } else if ($active.entity) {
        activeEntity = $active.entity.id;
    } else if (!activeEntity) {
        activeEntity = sortedEntityList.length > 0 ? sortedEntityList[0].id : null;
    }

    // Add new button for each entity
    if (sortedEntityList.length > 0) {
        sortedEntityList.forEach(function(entity, i) {
            var active = "";
            if (activeEntity) {
                active = hsCompareIDs(entity.id, activeEntity) ? "class='active'" : "";
            }

            var name = entity.name;
            if (entity.isRootInstance) {
                name = "#" + name;
            }
            if (entity.isAbstract) {
                name = "%" + name;
            }
            var elem = $(
                "<li " + active + "><a href='#' id='" + entity.id + "'data-toggle='tab'>" + name + "</a></li>");
            $("#entityOverviewNP").append(elem).append(" ");
            elem.click(function(event) {
                updateActiveEntity(event.target.id);
            });
        });
    }

    // Finally, set active entity
    if (activeEntity) {
        updateActiveEntity(activeEntity);
    } else {
        $("#entityPanelBodyD").hide();
    }
}

// --------------------------------------------------------------------------------
//                          Active Entity & Tab 1: Basics
// --------------------------------------------------------------------------------

function updateActiveEntity(entityID) {
    // Show form (is hidden only in case domain has no entities)
    $("#entityPanelBodyD").show();

    // Find active entity
    var entity = $active.domain.findElementByID(entityID);
    if (!entity) {
        alert("Invalid Entity ID: " + entityID);
        return;
    }
    if (entity.type !== "Entity") {
        alert("Invalid type: " + entity.type + " (required: Entity)");
        return;
    }

    // Save currently active entity (and all child values), then set new active entity
    saveEntityFormValues();
    $active.entity = entity;

    // Set panel heading
    $("#entityPanelHeadingD").text("Entity: " + (entity.isRootInstance ? "#" : "") + (entity.isAbstract ? "%" : "") + entity.name);

    //
    // Basics
    //

    $("#entityNameI").val(entity.name);
    $("#entityDescI").val(entity.desc);
    $("#entityTypeI").val(entity.entityType);
    $("#removeEntityB").html(entity.name + " <span class='glyphicon glyphicon-remove-sign'></span>");

    if (entity.isRootInstance) {
        $("#removeEntityB").hide();
        $("#entityTypeFG").hide();
        $("#parentEntityFG").hide();
        $("#rootEntityFG").hide();
    } else {
        // Show 'remove' button
        $("#removeEntityB").show();

        // Update and show info on parent class
        if (entity.hasParentClass()) {
            $("#parentEntityNameA").text(entity.getParentClass().name);
        } else {
            $("#parentEntityNameA").text("undefined");
        }
        $("#entityTypeFG").show();
        $("#parentEntityFG").show();

        // Update and show info on root entity status
        if (entity.isRootEntity) {
            $("#rootEntityStatusA").text("Yes");
            $("#rootEntityMakeRootA").hide();
        } else {
            $("#rootEntityStatusA").text("No");
            $("#rootEntityMakeRootA").show();
        }
        $("#rootEntityFG").show();
    }

    //
    // Update Properties, Aggregations, Associations and Views
    //

    updateActiveProperty();
    updateActiveEnum();
    updateActiveAggregation();
    updateActiveAssociation();
    updateViewLists();
}

function entityNameChanged() {
    saveAllFormValues();

    // Update Domain form with new Entity, then update Entity form
    updateActiveDomain($active.entity.id);

    // Selected "name" text from newly created entity
    $("#entityDescI").focus().select();
}

function addNewEntity() {
    // Save current values
    saveAllFormValues();

    // Create new Entity
    var newEntity = $active.domain.addNew_Entity("New_Entity", "");
    newEntity.isRootInstance = false;
    newEntity.isRootEntity = false;

    // Update Domain form with new Entity, then update Entity form
    updateActiveDomain(newEntity.id);

    // Selected "name" text from newly created entity
    $("#entityNameI").focus().select();
}

function removeEntity() {
    $active.domain.remove_Entity($active.entity.id);
    $active.entity = null;
    updateActiveDomain();
}

function makeRootEntity() {
    saveAllFormValues();
    var newReln = $active.domain.getRootInstance().addNew_Relationship("my" + $active.entity.name + "s", "");
    newReln.isAggregation = true;
    newReln.setTargetEntity($active.entity);
    $active.entity.isRootEntity = true;
    updateActiveEntity($active.entity.id);
    console.log("Entity '" + $active.entity.name + "' is now a root entity (new relationship '" + newReln.name + "' was automatically added)");
    createModal("New Status", "Entity '" + $active.entity.name + "' is now a root entity (new relationship '" + newReln.name + "' was automatically added)");
}

// --------------------------------------------------------------------------------
//                                Tab 2: Properties
// --------------------------------------------------------------------------------

function updateActiveProperty(argActivePropertyID) {
    // Sorted property list
    var sortedPropertyList = $active.entity.getBasicProperties(true);

    // Which ID for the active property (if any)?
    var firstProperty = sortedPropertyList.length > 0 ? sortedPropertyList[0].id : null;
    var activePropertyID = argActivePropertyID || firstProperty;

    // Save form values
    savePropertyFormValues();

    // Update property list
    $("#propertiesNP").empty();
    if (sortedPropertyList.length > 0) {
        sortedPropertyList.forEach(function(property, i) {
            var active = hsCompareIDs(property.id, activePropertyID) ? " class='active'" : "";
            var elem = $("<li" + active + "><a href='#' id='" + property.id + "' data-toggle='tab'>" + property.name + "</a></li>");
            $("#propertiesNP").append(elem).append(" ");
            elem.click(function(event) {
                updateActiveProperty(event.target.id);
            });
        });
        $("#propertyDetailsF").show();
    } else {
        $("#propertyDetailsF").hide();
    }

    // Add "new property" button
    var elem = $("<li><a href='#' id='addPropertyA' data-toggle='tab'><span class='glyphicon glyphicon-plus-sign'></span></a></li>");
    $("#propertiesNP").append(elem);
    elem.click(addNewProperty);

    // Set active property, either using argument provided, or first element (if there is one):
    if (activePropertyID) {
        var property = $active.domain.findElementByID(activePropertyID);
        if (!property) {
            alert("Invalid Property ID: " + activePropertyID);
            alert("Invalid Property ID: " + activePropertyID);
            return;
        }
        if (property.type !== "BasicProperty") {
            alert("Invalid type: " + property.type + " (required: BasicProperty");
            return;
        }

        // Set new active property
        $active.basicProperty = property;

        // Set form values with data from active property
        $("#propertyNameI").val(property.name);
        $("#propertyDescI").val(property.desc);
        $("#propertyDefaultValueI").val(property.defaultValue);
        $("#propertyExamplesI").val(property.examples);
        $("#propertyTypeI").val(property.propertyType);
        $("#removePropertyB").html(property.name + " <span class='glyphicon glyphicon-remove-sign'></span>");
    }
}

function propertyNameChanged() {
    saveAllFormValues();
    updateActiveProperty($active.basicProperty.id);
}

function addNewProperty() {
    // Create new Property
    var newProperty = $active.entity.addNew_BasicProperty("New_Property", "");
    newProperty.propertyType = "string";

    // Now update the active property
    updateActiveProperty(newProperty.id);

    // Selected "name" text from newly created property
    $("#propertyNameI").focus().select();
}

function removeProperty() {
    $active.entity.remove_BasicProperty($active.basicProperty.id);
    $active.basicProperty = null;
    updateActiveProperty();
}

// --------------------------------------------------------------------------------
//                                Tab 3: Enums
// --------------------------------------------------------------------------------

function updateActiveEnum(argActiveEnumID) {
    // Sorted enum list
    var sortedEnumList = $active.entity.getEnums(true);

    // Which ID for the active enum (if any)?
    var firstEnum = sortedEnumList.length > 0 ? sortedEnumList[0].id : null;
    var activeEnumID = argActiveEnumID || firstEnum;

    // Save form values
    saveEnumFormValues();

    // Update enum list
    $("#enumsNP").empty();
    if (sortedEnumList.length > 0) {
        sortedEnumList.forEach(function(enumeration, i) {
            var active = hsCompareIDs(enumeration.id, activeEnumID) ? " class='active'" : "";
            var elem = $("<li" + active + "><a href='#' id='" + enumeration.id + "'data-toggle='tab'>" + enumeration.name + "</a></li>");
            $("#enumsNP").append(elem).append(" ");
            elem.click(function(event) {
                updateActiveEnum(event.target.id);
            });
        });
        $("#enumDetailsF").show();
    } else {
        $("#enumDetailsF").hide();
    }

    // Add "new enum" button
    var elem = $("<li><a href='#' id='addEnumA' data-toggle='tab'><span class='glyphicon glyphicon-plus-sign'></span></a></li>");
    $("#enumsNP").append(elem);
    elem.click(addNewEnum);

    // Set active enum, either using argument provided, or first element (if there is one):
    if (activeEnumID) {
        var enumeration = $active.domain.findElementByID(activeEnumID);
        if (!enumeration) {
            alert("Invalid Enumeration ID: " + activeEnumID);
            return;
        }
        if (enumeration.type !== "Enumeration") {
            alert("Invalid type: " + enumeration.type + " (required: Enumeration");
            return;
        }

        // Set new active enum
        $active.enumeration = enumeration;

        // Set form values with data from active enum
        var selection = enumeration.validEnumSelections ? enumeration.validEnumSelections : "Exactly One";
        $("#enumValidSelectionI").val(selection);
        $("#enumNameI").val(enumeration.name);
        $("#enumDescI").val(enumeration.desc);
        $("#enumLiteralsI").val(enumeration.toString());
        $("#removeEnumB").html(enumeration.name + " <span class='glyphicon glyphicon-remove-sign'></span>");
    }
}

function enumNameChanged() {
    saveAllFormValues();
    updateActiveEnum($active.enumeration.id);
}

function addNewEnum() {
    // Create new Enumeration
    var newEnum = $active.entity.addNew_Enumeration("New_Enumeration", "");
    newEnum.validEnumSelections = "Exactly One";

    // Now update the active enum
    updateActiveEnum(newEnum.id);

    // Selected "name" text from newly created enum
    $("#enumNameI").focus().select();
}

function removeEnum() {
    $active.entity.remove_Enumeration($active.enumeration.id);
    $active.enumeration = null;
    updateActiveEnum();
}

function updateEnumEditLiteralsTable() {
    var body = "<thead><tr><th>Name</th><th>Description</th><th>Position</th><th>Icon</th><th></th></tr></thead>";
    body += "<tbody>";
    $active.enumeration.literals.forEach(function(literal) {
        var name = literal.name ? literal.name : "";
        var desc = literal.desc ? literal.desc : "";
        var pos = literal.position ? literal.position : "";
        var icon = literal.icon ? literal.icon : "";
        var id = literal.id;
        body += "<tr class='literal-row' id='" + literal.id + "'>" +
            "<td><input id='" + id + "_name' type='text' class='form-control' value='" + name + "'/></td>" +
            "<td><input id='" + id + "_desc' type='text' class='form-control' value='" + desc + "'/></td>" +
            "<td><input id='" + id + "_pos'  type='text' class='form-control' value='" + pos + "'/></td>" +
            "<td><input id='" + id + "_icon' type='text' class='form-control' value='" + icon + "'/></td>" +
            "<td><a href='#' class='enumDeleteLiteral' id='" + id + "'><span class='glyphicon glyphicon-remove'></span></a></td>" +
            "</tr>";
    });
    body += "</tbody>";
    var table = "<table class='table'>" + body + "</table>";
    var form = "<form class='form-horizontal'>" + table + "</form>";
    form += "<button type='button' id='enumAddLiteral' class='btn btn-primary'><span class='glyphicon glyphicon-plus-sign'></span> Add Literal</button> ";
    form += "<button type='button' id='enumAutoNumber' class='btn btn-primary'><span class='glyphicon glyphicon-cog'></span> Auto Number</button>";

    $("#enumEditLiterals_LiteralsT").html($(form));

    $("#saveEnumLiteralsB").on("click", enumSaveLiterals);

    $("#enumAutoNumber").on("click", function() {
        var pos = 1;
        for (var i in $active.enumeration.literals) {
            $active.enumeration.literals[i].position = pos++;
        }
        enumSaveLiterals();
        updateEnumEditLiteralsTable();
    });

    $(".enumDeleteLiteral").on("click", function() {
        enumSaveLiterals();
        $active.enumeration.remove_Literal($(this).attr("id"));
        updateEnumEditLiteralsTable();
    });

    $("#enumAddLiteral").on("click", function() {
        enumSaveLiterals();
        var literal = $active.enumeration.addNew_Literal("New");
        literal.position = $active.enumeration.literals.length;
        literal.icon = "";
        updateEnumEditLiteralsTable();
    });
}

function enumEditLiterals() {
    updateEnumEditLiteralsTable();
    $("#enumEditLiteralsM").modal();
}

function enumSaveLiterals() {
    for (var i in $active.enumeration.literals) {
        var literal = $active.enumeration.literals[i];
        literal.name = $("#" + literal.id + "_name").val();
        literal.desc = $("#" + literal.id + "_desc").val();
        literal.pos = $("#" + literal.id + "_pos").val();
        literal.icon = $("#" + literal.id + "_icon").val();
    }
    $("#enumLiteralsI").val($active.enumeration.toString());
}

// --------------------------------------------------------------------------------
//                              Tab 4: Aggregations
// --------------------------------------------------------------------------------

function updateActiveAggregation(argActiveAggregationID) {
    // Save aggregation form data
    saveAggregationFormValues();

    // Which ID for the active aggregation (if any)?
    var aggs = $active.entity.getAggregations(true);
    var firstAgg = aggs.length > 0 ? aggs[0].id : null;
    var activeAggregationID = argActiveAggregationID || firstAgg;

    // Update aggregation list
    $("#aggregationNP").empty();
    if (aggs.length > 0) {
        aggs.forEach(function(aggregation, i) {
            var active = hsCompareIDs(aggregation.id, activeAggregationID) ? " class='active'" : "";
            var elem = $("<li" + active + "><a href='#' id='" + aggregation.id + "'data-toggle='tab'>" + aggregation.name + "</a></li>");
            $("#aggregationNP").append(elem).append(" ");
            elem.click(function(event) {
                updateActiveAggregation(event.target.id);
            });
        });
        $("#aggregationDetailsF").show();
    } else {
        $("#aggregationDetailsF").hide();
    }

    // Append "new aggregation" button to the end
    var elem = $("<li><a href='#' id='addAggregationA' data-toggle='tab'><span class='glyphicon glyphicon-plus-sign'></span></a></li>");
    $("#aggregationNP").append(elem);
    elem.click(addNewAggregation);

    // Populate form, if active aggregation is given
    if (activeAggregationID) {
        // Find active aggregation
        var aggregation = $active.domain.findElementByID(activeAggregationID);
        if (!aggregation) {
            alert("Invalid Relationship ID: " + id);
            return;
        }
        if (aggregation.type !== "Relationship") {
            alert("Invalid type: " + aggregation.type + " (required: Relationship");
            return;
        }

        // Set new active aggregation
        $active.aggregation = aggregation;

        // Set form values with data from active aggregation
        $("#aggregationNameI").val(aggregation.name);
        $("#aggregationDescI").val(aggregation.desc);
        $("#removeAggregationB").html(aggregation.name + " <span class='glyphicon glyphicon-remove-sign'></span>");
        if (aggregation.hasTargetEntity()) {
            $("#aggregationTargetNameA").text(aggregation.getTargetEntity().name);
        } else {
            $("#aggregationTargetNameA").text("undefined");
        }
        $("#aggregationTargetAvgI").val(aggregation.targetAverage);
        $("#aggregationTargetMinI").val(aggregation.targetMin);
        $("#aggregationTargetMaxI").val(aggregation.targetMax);
    }
}

function aggregationNameChanged() {
    updateActiveAggregation($active.aggregation.id);
}

function aggregationAverageChanged() {
    var avg = $("#aggregationTargetAvgI").val();
    avg = parseInt(avg);
    $active.aggregation.targetAverage = avg;
    console.log("Avg " + avg);
    $active.aggregation.updateDesc();
    $("#aggregationDescI").val($active.aggregation.desc);
}

function addNewAggregation() {
    // Create new Aggregation
    var newAggregation = $active.entity.addNew_Relationship("New_Aggregation", "");
    newAggregation.isAggregation = true;

    // Now update the active aggregation
    updateActiveAggregation(newAggregation.id);

    // Selected "name" text from newly created aggregation
    $("#aggregationNameI").focus().select();
}

function removeAggregation() {
    $active.entity.remove_Relationship($active.aggregation.id);
    $active.aggregation = null;
    updateActiveAggregation();
}

// --------------------------------------------------------------------------------
//                              Tab 5: Associations
// --------------------------------------------------------------------------------

function updateActiveAssociation(argActiveAssociationID) {
    // Save current association data
    saveAssociationFormValues();

    // Which ID for the active association (if any)?
    var assocs = $active.entity.getAssociations(true);
    var firstAssoc = assocs.length > 0 ? assocs[0].id : null;
    var activeAssociationID = argActiveAssociationID || firstAssoc;

    // Update association list
    $("#associationNP").empty();
    if (assocs.length > 0) {
        assocs.forEach(function(association, i) {
            var active = hsCompareIDs(association.id, activeAssociationID) ? " class='active'" : "";
            var elem = $("<li" + active + "><a href='#' id='" + association.id + "'data-toggle='tab'>" + association.name + "</a></li>");
            $("#associationNP").append(elem).append(" ");
            elem.click(function(event) {
                updateActiveAssociation(event.target.id);
            });
        });
        $("#associationDetailsF").show();
    } else {
        $("#associationDetailsF").hide();
    }

    // Append "new association" button to the end
    var elem = $("<li><a href='#' id='addAssociationA' data-toggle='tab'><span class='glyphicon glyphicon-plus-sign'></span></a></li>");
    $("#associationNP").append(elem);
    elem.click(addNewAssociation);

    // Populate form, if there is an active association
    if (activeAssociationID) {
        var association = $active.domain.findElementByID(activeAssociationID);
        if (!association) {
            alert("Invalid Relationship ID: " + id);
            return;
        }
        if (association.type !== "Relationship") {
            alert("Invalid type: " + association.type + " (required: Relationship");
            return;
        }

        // Set new active association
        $active.association = association;

        // Set form values with data from active assoc
        $("#associationNameI").val(association.name);
        $("#associationDescI").val(association.desc);
        $("#removeAssociationB").html(association.name + " <span class='glyphicon glyphicon-remove-sign'></span>");
        if (association.hasTargetEntity()) {
            $("#associationTargetNameA").text(association.getTargetEntity().name);
        } else {
            $("#associationTargetNameA").text("undefined");
        }
        $("#associationTargetAvgI").val(association.targetAverage);
        $("#associationTargetMinI").val(association.targetMin);
        $("#associationTargetMaxI").val(association.targetMax);
    }
}

function associationNameChanged() {
    updateActiveAssociation($active.association.id);
}

function associationAverageChanged() {
    var avg = $("#associationTargetAvgI").val();
    avg = parseInt(avg);
    $active.association.targetAverage = avg;
    console.log("Avg " + avg);
    $active.association.updateDesc();
    $("#associationDescI").val($active.association.desc);
}

function addNewAssociation() {
    // Create new Association
    var newAssociation = $active.entity.addNew_Relationship("New_Association", "");
    newAssociation.isAggregation = false;

    // Now update the active association
    updateActiveAssociation(newAssociation.id);

    // Selected "name" text from newly created assoc
    $("#associationNameI").focus().select();
}

function removeAssociation() {
    $active.entity.remove_Relationship($active.association.id);
    $active.association = null;
    updateActiveAssociation();
}

// --------------------------------------------------------------------------------
//                                Tab 6: Views
// --------------------------------------------------------------------------------

function updateViewLists() {
    // Update page view list
    var sortedPageViewList = $active.entity.getPageViews(true);
    $("#pageViewsNP").empty();
    sortedPageViewList.forEach(function(pageView, i) {
        // TODO: Generate this on server.
        var url = '../pageView/' + $active.domain.name + '?pv=' + pageView.id;
        var elem = $('<li><a href="' + url + '" id="' + pageView.id + '">' + pageView.name + '</a></li>');
        $("#pageViewsNP").append(elem).append(" ");
    });

    // Add "new page view" button
    var elem = $("<li><a href='#' id='addPageViewA' data-toggle='tab'><span class='glyphicon glyphicon-plus-sign'></span></a></li>");
    $("#pageViewsNP").append(elem);
    elem.click(addNewPageView);

    // ...and now table views
    var sortedTableViewList = $active.entity.getTableViews(true);
    $("#tableViewsNP").empty();
    sortedTableViewList.forEach(function(tableView, i) {
        // TODO: Generate this on server.
        var url = "./../tableView/" + $active.domain.name + "?tv=" + tableView.id;
        var elem = $('<li><a href="' + url + '" id="' + tableView.id + '">' + tableView.name + '</a></li>');
        $("#tableViewsNP").append(elem).append(" ");
    });

    // Add "new table view" button
    elem = $("<li><a href='#' id='addTableViewA' data-toggle='tab'><span class='glyphicon glyphicon-plus-sign'></span></a></li>");
    $("#tableViewsNP").append(elem);
    elem.click(addNewTableView);
}

function addNewTableView() {
}

function addNewPageView() {
    /*
    // Create new Property
    var newProperty = $active.entity.addNew_BasicProperty("New_Property", "");
    newProperty.propertyType = "string";

    // Now update the active property
    updateActiveProperty(newProperty.id);

    // Selected "name" text from newly created property
    $("#propertyNameI").focus().select();
    */
}

// --------------------------------------------------------------------------------
//                                Entity Selection
// --------------------------------------------------------------------------------

function selectTargetEntityForInheritance() {
    selectTargetEntity("inheritance");
}

function selectTargetEntityForAggregation() {
    selectTargetEntity("aggregation");
}

function selectTargetEntityForAssociation() {
    selectTargetEntity("association");
}

function selectTargetEntity(context) {
    var rows = "";
    $active.domain.entities.forEach(function(entity) {
        rows += "<tr class='entity-selection-row' data-href='" + entity.id + "'>" +
            "<td>" + entity.name + "</td>" +
            "<td>" + entity.desc + "</td>" +
            "<td><span class='glyphicon glyphicon-circle-arrow-right'></span></td>" +
            "</tr>";
    });
    $("#selectElement_ElementsT").html($("<tbody>" + rows + "</tbody>"));

    switch (context) {
        case "aggregation":
            $("#selectElement_titleH").text("Select Aggregation Target");
            $(".entity-selection-row").click(function() {
                $active.aggregationTarget = $active.domain.findElementByID($(this).data("href"));
                $("#aggregationTargetNameA").text($active.aggregationTarget.name);

                // Save to Aggregation object!
                $active.aggregation.setTargetEntity($active.aggregationTarget);

                // Update description
                $active.aggregation.updateDesc();
                $("#aggregationDescI").val($active.aggregation.desc);

                $("#selectElementM").modal('hide');
            });
            break;
        case "association":
            $("#selectElement_titleH").text("Select Association Target");
            $(".entity-selection-row").click(function() {
                $active.associationTarget = $active.domain.findElementByID($(this).data("href"));
                $("#associationTargetNameA").text($active.associationTarget.name);

                // Save to Aggregation object!
                $active.association.setTargetEntity($active.associationTarget);

                // Update description
                $active.association.updateDesc();
                $("#associationDescI").val($active.association.desc);

                $("#selectElementM").modal('hide');
            });
            break;
        case "inheritance":
            $("#selectElement_titleH").text("Select Parent Entity");
            $(".entity-selection-row").click(function() {
                var pc = $active.domain.findElementByID($(this).data("href"));
                $active.entity.setParentClass(pc);
                $("#parentEntityNameA").text(pc.name);

                $("#selectElementM").modal('hide');
            });
            break;
        default:
            throw new Error("Undefined: " + context);
    }

    $("#selectElementM").modal();
}

// --------------------------------------------------------------------------------
//                     Save form values to local objects
// --------------------------------------------------------------------------------

function saveAllFormValues() {
    saveEntityFormValues();
    savePropertyFormValues();
    saveEnumFormValues();
    saveAggregationFormValues();
    saveAssociationFormValues();
}

function saveEntityFormValues() {
    if ($active.entity) {
        $active.entity.name = $("#entityNameI").val();
        $active.entity.desc = $("#entityDescI").val();
        $active.entity.entityType = $("#entityTypeI").val();
    }
}

function savePropertyFormValues() {
    if ($active.basicProperty) {
        $active.basicProperty.name = $("#propertyNameI").val();
        $active.basicProperty.desc = $("#propertyDescI").val();
        $active.basicProperty.defaultValue = $("#propertyDefaultValueI").val();
        $active.basicProperty.examples = $("#propertyExamplesI").val();
        $active.basicProperty.propertyType = $("#propertyTypeI").val();
    }
}

function saveEnumFormValues() {
    if ($active.enumeration) {
        $active.enumeration.name = $("#enumNameI").val();
        $active.enumeration.desc = $("#enumDescI").val();
        switch ($("#enumValidSelectionI").val()) {
            // TBD: use proper IDs for validEnumSelections:
            case "Exactly One": $active.enumeration.validEnumSelections = "Exactly One"; break;
            case "Zero or One": $active.enumeration.validEnumSelections = "Zero or One"; break;
            case "Zero to Many": $active.enumeration.validEnumSelections = "Zero to Many"; break;
            case "One to Many": $active.enumeration.validEnumSelections = "One to Many"; break;
            default: throw new Error("Unknown selection: " + $("#enumValidSelectionI").val());
        }
    }
}

function saveAggregationFormValues() {
    if ($active.aggregation) {
        $active.aggregation.name = $("#aggregationNameI").val();
        $active.aggregation.desc = $("#aggregationDescI").val();
        $active.aggregation.targetMin = $("#aggregationTargetMinI").val();
        $active.aggregation.targetMax = $("#aggregationTargetMaxI").val();
        $active.aggregation.targetAverage = $("#aggregationTargetAvgI").val();

        $active.aggregation.updateDesc();

        // $active.aggregationTarget is saved directly in selectTargetEntity()
    }
}

function saveAssociationFormValues() {
    if ($active.association) {
        $active.association.name = $("#associationNameI").val();
        $active.association.desc = $("#associationDescI").val();
        $active.association.targetMin = $("#associationTargetMinI").val();
        $active.association.targetMax = $("#associationTargetMaxI").val();
        $active.association.targetAverage = $("#associationTargetAvgI").val();

        $active.association.updateDesc();

        // $active.associationTarget is saved directly in selectTargetEntity()
    }
}

// --------------------------------------------------------------------------------
//                                 Nav Bar Functions
// --------------------------------------------------------------------------------

function updateMyNavBar() {
    var ddMenu = [
        ["Domain Details", "openDomainOverviewModal()"],
        ["Entity Graph", "entityGraph()"],
        ["Quantity Structure", "quantityStructure()"]
    ];

    updateNavBar(
        ["Domain: " + $active.domain.name, "#"],
        ddMenu,
        "openTestAppModal()",
        postDomainDataToServer, domainCancelEvent, domainDeleteEvent);
}

function entityGraph() {
    postDomainDataToServer();
    window.location.href = $active._links.entityGraph.href;
}

function setDefaultAveragesAndGenerateTestData() {
    var avg = 3;
    $active.domain.setDefaultAverages(avg);
    $("#aggregationTargetAvgI").val(avg);
    postDomainDataToServer();
    generateTestData();
}

function quantityStructure() {
    postDomainDataToServer();
    window.location.href = $active._links.quantityStructure.href;
}

function postDomainDataToServer() {
    // Save last changes from form => $active.domain
    saveAllFormValues();

    // Post to server
    postDomainData();
}

function domainCancelEvent() {
    getDomainData(function() {
        updateActiveDomain();
    });
}

function domainDeleteEvent() {
    console.log("TBD: Delete");
}

function openDomainOverviewModal() {
    $("#domainDetailsM").modal();
    $("#domainNameI").val($active.domain.name);
    $("#domainDescI").val($active.domain.desc);
    $("#domainDefOfManyI").val($active.domain.definitionOfMany);
    $("#saveDomainOververviewB").on("click", saveDomainOverviewFormData);
}

function openTestAppModal() {
    postDomainDataToServer();
    $("#generateDefaultViewsB").on("click", generateDefaultViews);
    $("#generateTestDataB").on("click", generateTestData);
    $("#removeTestDataB").on("click", removeTestData);
    $("#viewTestAppB").on("click", function() {
        setTimeout(function() {
            window.location.href = $active._links.WarpJS.href;
        }, 750);
    });

    $("#testAppM").modal();
}

function saveDomainOverviewFormData() {
    $active.domain.name = $("#domainNameI").val();
    $active.domain.desc = $("#domainDescI").val();
    $active.domain.definitionOfMany = $("#domainDefOfManyI").val();

    // Update domain name
    updateMyNavBar();
}

function showWarnings() {
    createModal("Warnings for Domain '" + $active.domain.name+"'", $active.warnings, "warning", null);
}