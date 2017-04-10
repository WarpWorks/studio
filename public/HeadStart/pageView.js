// --------------------------------------------------------------------------------
//                           Initialize / Update Page
// --------------------------------------------------------------------------------
var $active = {};
$active.domain = null;

$(document).ready(function() {
    pvLoadDomainOverview();
});

function pvLoadDomainOverview() {
    getDomainData(function() {
        updateActivePageView();
    });
}

function updateActivePageView(activePanel) {
    var pvID = hsGetURLParam("pv");
    if (!pvID) {
        throw "URL must contain PageViewID ('pv')!";
    }

    // Find active page view
    var pv = $active.domain.findElementByID(pvID);
    if (!pv) {
        alert("Invalid PageViewID: " + pvID);
        return;
    }
    if (pv.type !== "PageView") {
        alert("Invalid type: " + pv.type + " (required: PageView)");
        return;
    }
    $active.pageView = pv;
    $("#pvPanelHeadingD").text("PageView for Entity '" + pv.parent.name + "'");

    // Update NavBar
    updateNavBar(
        ["Domain: " + $active.domain.name + " <span class='glyphicon glyphicon-arrow-left'></span>", "../domain/" + $active.domain.name],
        null,
        null,
        savePageView,
        cancelChanges,
        null);

    // Page view basics
    $("#pvNameI").val($active.pageView.name);

    // Hide details as long as no panel is selected:
    $("#pvPanelDetailsUL").hide();
    $("#pvPanelItemDetailsUL").hide();

    // Update panel list
    var sortedPanelList = $active.pageView.getPanels(true);
    $("#pvPanelsNP").empty();
    if (sortedPanelList.length > 0) {
        sortedPanelList.forEach(function(panel, i) {
            var active = "";
            var useActivePanel = activePanel && activePanel.id === panel.id;
            if (useActivePanel || (!activePanel && i === 0)) { // Activate and display panel
                updatePanelOverview(panel);
                active = " class='active'";
            }
            var elem = $("<li" + active + "><a href='#' id='Panel" + panel.id + "' data-toggle='tab'>" + panel.name + "</a></li>");
            $("#pvPanelsNP").append(elem).append(" ");
            elem.click(function(event) {
                savePageView();
                updatePanelOverview(panel);
            });
        });
    }

    // Add "new panel" button to panel list
    var elem = $("<li><a href='#' id='addPanelA' data-toggle='tab' title='Add Panel'><span class='glyphicon glyphicon-plus-sign'></span></a></li>");
    elem.click(function() {
        savePageView();
        var newPanel = $active.pageView.addNew_Panel("New_Panel", "Tooltip");
        updateActivePageView(newPanel);
    });
    $("#pvPanelsNP").append(elem);
    elem.click(addNewPageView);
}

function updatePanelOverview(panel) {
    $active.panel = panel;

    // Panel basics
    $("#pvPanelDetailsUL").empty();
    var li = $("<li class='list-group-item'></li>");
    li.append($(
        "<form class='form-horizontal' id='panelBasicsF'>" +
        "   <div class='form-group'>" +
        "       <label for='panelNameI' class='col-sm-2 control-label'>Panel</label>" +
        "       <div class='col-sm-3'>" +
        "           <input type='text' class='form-control' id='panelNameI'" +
        "                   onchange='panelNameChanged()'>" +
        "       </div>" +
        "       <label for='panelPositionI' class='col-sm-2 control-label'>Position</label>" +
        "       <div class='col-sm-3'>" +
        "           <input type='text' class='form-control' id='panelPositionI'>" +
        "       </div>" +
        "       <div class='col-sm-2'>" +
        "           <ul class='nav nav-pills pull-right' id='panelRemoveNP'>" +
        "               <li><a href='#' id='panelRemoveA' data-toggle='tab' title='Remove Panel'><span class='glyphicon glyphicon-remove'></span></a></li>" +
        "           </ul>" +
        "       </div>" +
        "   </div>" +
        "   <div class='form-group'>" +
        "       <label for='panelLabelI' class='col-sm-2 control-label'>Label</label>" +
        "       <div class='col-sm-3'>" +
        "           <input type='text' class='form-control' id='panelLabelI'>" +
        "       </div>" +
        "       <label for='panelDescI' class='col-sm-2 control-label'>Description</label>" +
        "       <div class='col-sm-5'>" +
        "           <input type='text' class='form-control' id='panelDescI'>" +
        "       </div>" +
        "   </div>" +
        "   <div class='form-group'>" +
        "       <label class='col-sm-2 control-label'>Add</label>" +
        "       <div class='col-sm-10'>" +
        "           <div class='btn-group' role='group'>" +
        "               <button type='button' id='panelAddPropertyB' class='btn btn-default'>Property</button>" +
        "               <button type='button' id='panelAddEnumB' class='btn btn-default'>Enum</button>" +
        "               <button type='button' id='panelAddRelationshipB' class='btn btn-default'>List</button>" +
        "               <button type='button' id='panelAddSeparatorB' class='btn btn-default'>Separator</button>" +
        "           </div>" +
        "       </div>" +
        "   </div>" +
        "</form>"));

    $("#pvPanelDetailsUL").append(li);
    $("#panelNameI").val(panel.name);
    $("#panelPositionI").val(panel.position);
    $("#panelLabelI").val(panel.label);
    $("#panelDescI").val(panel.desc);
    var el = $("#panelDescI");

    // Callback to deal with new position
    $("#panelPositionI").on("change", function() {
        savePageView();
        updateActivePageView($active.panel);
    });

    // Callback to remove Panel:
    $("#panelRemoveNP").on("click", function() {
        var callbacks = [
            {
                close: true,
                label: "Remove Panel",
                callback: function() {
                    $active.pageView.remove_Panel($active.panel.id);
                    updateActivePageView();
                }
            },
            {
                close: true,
                label: "Cancel"
            }
        ];
        createModal("Confirmation", "Do you really want to remove the selected panel?", "warning", callbacks);
    });

    // Callbacks to add PanelItems:
    $("#panelAddPropertyB").on("click", function() {
        var pi = $active.panel.addNew_BasicPropertyPanelItem("PropertyPanelItem", "Tooltip");
        pi.position = $active.panel.nextPanelItemPosition();
        updatePanelOverview($active.panel);
    });
    $("#panelAddEnumB").on("click", function() {
        var pi = $active.panel.addNew_EnumPanelItem("EnumPanelItem", "Tooltip");
        pi.position = $active.panel.nextPanelItemPosition();
        updatePanelOverview($active.panel);
    });
    $("#panelAddSeparatorB").on("click", function() {
        var pi = $active.panel.addNew_SeparatorPanelItem("SeparatorPanelItem", "Tooltip");
        pi.position = $active.panel.nextPanelItemPosition();
        updatePanelOverview($active.panel);
    });
    $("#panelAddRelationshipB").on("click", function() {
        var pi = $active.panel.addNew_RelationshipPanelItem("RelationshipPanelItem", "Tooltip");
        pi.position = $active.panel.nextPanelItemPosition();
        updatePanelOverview($active.panel);
    });

    // xxx:
    // TBD: What about - position:number, columns:number, addToTabGroup:boolean, alternatingColors:boolean...?
    // TBD: Add and Remove Views
    // TBD: Ensure numbers are valid numbers (e.g. positions)
    // TBD: TableView Editor
    // TBD: For all "select" dialogues: Remove "<=", start selection when clicking on name/"undefined"
    // TBD: Save, wenn man von Domain auf PageView wechselt
    // TBD: Auto-Fill Quantity Structure

    // Update panel item list:
    var pItems = panel.getAllPanelItems(true);
    $("#pvPanelItemDetailsUL").empty();
    var count = -1;
    for (var i in pItems) {
        count++;
        var pItem = pItems[i];
        var piType = "";
        var piGlyph = "";
        switch (pItem.type) {
            case "SeparatorPanelItem": piType = "Separator"; piGlyph = "glyphicon-minus"; break;
            case "RelationshipPanelItem": piType = "List"; piGlyph = "glyphicon-th-list"; break;
            case "BasicPropertyPanelItem": piType = "Property"; piGlyph = "glyphicon-tag"; break;
            case "EnumPanelItem": piType = "Enum"; piGlyph = "glyphicon-option-vertical"; break;
            default: throw "Unknown type: " + pItems[i].type;
        }

        var piSpecificFormGroups = "";

        // "Label" and "Desc" fields for all except Separator
        switch (pItem.type) {
            case "SeparatorPanelItem":
                break;
            case "RelationshipPanelItem":
            case "BasicPropertyPanelItem":
            case "EnumPanelItem":
                piSpecificFormGroups =
                    "   <div class='form-group'>" +
                    "       <label for='piLabelI' class='col-sm-2 control-label'>Label</label>" +
                    "       <div class='col-sm-3'>" +
                    "           <input type='text' class='form-control' id='piLabelI" + pItem.id + "' value='" + pItem.label + "'>" +
                    "       </div>" +
                    "       <label for='piDescI' class='col-sm-2 control-label'>Description</label>" +
                    "       <div class='col-sm-5'>" +
                    "           <input type='text' class='form-control' id='piDescI" + pItem.id + "' value='" + pItem.desc + "'>" +
                    "       </div>" +
                    "   </div>";
        }

        // Now the individual ones:
        switch (pItem.type) {
            case "SeparatorPanelItem":
                break;
            case "RelationshipPanelItem":
                var relationship = pItem.hasRelationship() ? pItem.getRelationship() : {name: "undefined"};
                var view = pItem.hasView() ? pItem.getView() : {name: "undefined"};
                var viewName = pItem.hasView() ? view.parent.name + "::" + view.name : "undefined";
                piSpecificFormGroups +=
                    "<div class='form-group'>" +
                    "   <label for='piRelationshipI' class='col-sm-2 control-label'>Target</label>" +
                    "   <div class='col-sm-3'>" +
                    "       <ul class='nav nav-pills'>" +
                    "           <li><a href='#' id='panelItemTargetNameA-" + pItem.id + "' onclick='selectRelationship(event)'>" + relationship.name + "</a></li>" +
                    "       </ul>" +
                    "   </div>" +
                    "   <label for='piViewI' class='col-sm-2 control-label'>View</label>" +
                    "   <div class='col-sm-3'>" +
                    "       <ul class='nav nav-pills'>" +
                    "           <li><a href='#' id='panelItemTargetViewNameA-" + pItem.id + "' onclick='selectView(event)'>" + viewName + "</a></li>" +
                    "       </ul>" +
                    "   </div>" +
                    "</div>" +
                    "<div class='form-group'>" +
                    "   <label for='panelStypeI' class='col-sm-2 control-label'>Style</label>" +
                    "   <div class='col-sm-3'>" +
                    "       <input type='text' class='form-control' id='panelItemListStyleI" + pItem.id + "'>" +
                    "   </div>" +
                    "</div>";

                break;
            case "BasicPropertyPanelItem":
                var property = pItem.hasBasicProperty() ? pItem.getBasicProperty() : {name: "undefined"};
                piSpecificFormGroups +=
                    "<div class='form-group'>" +
                    "   <label for='piPropertyI' class='col-sm-2 control-label'>Target</label>" +
                    "   <div class='col-sm-3'>" +
                    "       <ul class='nav nav-pills'>" +
                    "           <li><a href='#' id='panelItemTargetNameA-" + pItem.id + "' onclick='selectProperty(event)'>" + property.name + "</a></li>" +
                    "       </ul>" +
                    "   </div>" +
                    "</div>";
                break;
            case "EnumPanelItem":
                var enumeration = pItem.hasEnumeration() ? pItem.getEnumeration() : {name: "undefined"};
                piSpecificFormGroups +=
                    "<div class='form-group'>" +
                    "   <label for='piEnumerationI' class='col-sm-2 control-label'>Target</label>" +
                    "   <div class='col-sm-3'>" +
                    "       <ul class='nav nav-pills'>" +
                    "           <li><a href='#' id='panelItemTargetNameA-" + pItem.id + "' onclick='selectEnumeration(event)'>" + enumeration.name + "</a></li>" +
                    "       </ul>" +
                    "   </div>" +
                    "</div>";
                break;
            default: throw "Unknown type: " + pItem.type;
        }

        var bg = count % 2 === 0 ? "even-lg-item" : "";
        var li = $("<li class='list-group-item " + bg + "'></li>");
        var piForm =
            $("<form class='form-horizontal' id='panelItemBasicsF'>" +
            "   <div class='form-group'>" +
            "       <div class='col-sm-2'>" +
            "           <ul class='nav nav-pills pull-right' type='" + pItem.type + "'>" +
            "               <li><a href='#'><span class='glyphicon " + piGlyph + "'></span> " + piType + "</a></li>" +
            "           </ul>" +
            "       </div>" +

//            "       <label for='panelItemPositionI' class='col-sm-2 control-label'>Position</label>"+
            "       <div class='col-sm-3'>" +
            "           <input type='text' class='form-control' id='piPositionI" + pItem.id + "' value='" + pItem.position + "'>" +
            "       </div>" +
            "       <label for='panelItemNameI' class='col-sm-2 control-label'>Item Type</label>" +
            "       <div class='col-sm-3'>" +
            "           <input type='text' class='form-control' disabled value='" + piType + "'>" +
            "       </div>" +
            "       <div class='col-sm-2'>" +
            "           <ul class='nav nav-pills pull-right' id='piRemoveNP-" + pItem.id + "' type='" + pItem.type + "'>" +
            "               <li><a href='#' id='piRemoveA" + pItem.id + "' data-toggle='tab' title='Remove Panel Item'><span class='glyphicon glyphicon-remove'></span></a></li>" +
            "           </ul>" +
            "       </div>" +
            "   </div>" +
            piSpecificFormGroups +
            "</form>");
        li.append(piForm);
        $("#pvPanelItemDetailsUL").append(li);

        // Update panel items
        var pItems = $active.panel.getAllPanelItems(true);
        for (var i in pItems) {
            var pItem = pItems[i];
            if (pItem.type === "RelationshipPanelItem") {
                var elem = $("#panelItemListStyleI" + pItem.id);
                elem.val(pItem.style);
            }
        }

        // Callback to remove PanelItems:
        $("#piRemoveNP-" + pItem.id).on("click", function() {
            var id = $(this).attr("id").split("-")[1];
            var type = $(this).attr("type");
            console.log("Remove: " + id + ", type:" + type);
            switch (type) {
                case "SeparatorPanelItem":
                    $active.panel.remove_SeparatorPanelItem(id);
                    break;
                case "RelationshipPanelItem":
                    $active.panel.remove_RelationshipPanelItem(id);
                    break;
                case "BasicPropertyPanelItem":
                    $active.panel.remove_BasicPropertyPanelItem(id);
                    break;
                case "EnumPanelItem":
                    $active.panel.remove_EnumPanelItem(id);
                    break;
            }
            updatePanelOverview($active.panel);
        });
    }
    $("#pvPanelDetailsUL").show();
    $("#pvPanelItemDetailsUL").show();
}

function panelNameChanged() {
    $active.panel.name = $("#panelNameI").val();
    $("#Panel" + $active.panel.id).text($active.panel.name);
}

function addNewPageView() {
}

function cancelChanges() {
}

function savePageView() {
    // Page view basics
    $active.pageView.name = $("#pvNameI").val();

    // Active Panel
    if ($active.panel) {
        $active.panel.name = $("#panelNameI").val();
        $active.panel.position = $("#panelPositionI").val();
        $active.panel.label = $("#panelLabelI").val();
        $active.panel.desc = $("#panelDescI").val();

        var pItems = $active.panel.getAllPanelItems(true);
        for (var i in pItems) {
            var pItem = pItems[i];
            pItem.position = $("#piPositionI" + pItem.id).val();
            pItem.label = $("#piLabelI" + pItem.id).val();
            pItem.desc = $("#piDescI" + pItem.id).val();
            if (pItem.type === "RelationshipPanelItem") {
                pItem.style = $("#panelItemListStyleI" + pItem.id).val();
            }
        }
    }

    // Save back to server
    postDomainData();
}

function getIDfromSelectEvent(event) {
    event = event || window.event;
    var target = event.target || event.srcElement; // IE
    if (target.nodeType === 3) {
        target = target.parentNode;
    } // Safari Bug
    id = target.id; // Click can be on SPAN or HREF...
    return id.split("-")[1];
}

function selectProperty(event) {
    var panelItemID = getIDfromSelectEvent(event);

    var basicProperties = $active.pageView.parent.getBasicProperties();
    if (!basicProperties || basicProperties.length < 1) {
        createModal("Warning", "Entity '" + $active.pageView.parent.name + "' does not contain BasicProperty definitions!");
        return;
    }
    var rows = "<thead><tr><th>Property</th><th>Description</th><th></th><th></thead>";
    basicProperties.forEach(function(basicProperty) {
        rows += "<tr class='element-selection-row' data-property='" + basicProperty.id + "' data-pitem='" + panelItemID + "'>" +
            "<td>" + basicProperty.name + "</td>" +
            "<td>" + basicProperty.desc + "</td>" +
            "<td><span class='glyphicon glyphicon-circle-arrow-right'></span></td>" +
            "</tr>";
    });
    $("#selectElement_ElementsT").html($("<tbody>" + rows + "</tbody>"));

    $active.panelItem = $active.domain.findElementByID(panelItemID);
    $(".element-selection-row").click(function() {
        var propertyID = $(this).data("property");
        var property = $active.domain.findElementByID(propertyID);
        $active.panelItem.setBasicProperty(property);

        $("#panelItemTargetNameA-" + $active.panelItem.id).text(property.name);
        $("#selectElementM").modal('hide');
    });
    $("#selectElementM").modal();
}

function selectEnumeration(event) {
    var panelItemID = getIDfromSelectEvent(event);

    var enumerations = $active.pageView.parent.getEnums();
    if (!enumerations || enumerations.length < 1) {
        createModal("Warning", "Entity '" + $active.pageView.parent.name + "' does not contain Enumeration definitions!");
        return;
    }
    var rows = "<thead><tr><th>Enumeration</th><th>Description</th><th></th><th></thead>";
    enumerations.forEach(function(enumeration) {
        rows += "<tr class='element-selection-row' data-enumeration='" + enumeration.id + "' data-pitem='" + panelItemID + "'>" +
            "<td>" + enumeration.name + "</td>" +
            "<td>" + enumeration.desc + "</td>" +
            "<td><span class='glyphicon glyphicon-circle-arrow-right'></span></td>" +
            "</tr>";
    });
    $("#selectElement_ElementsT").html($("<tbody>" + rows + "</tbody>"));

    $active.panelItem = $active.domain.findElementByID(panelItemID);
    $(".element-selection-row").click(function() {
        var enumerationID = $(this).data("enumeration");
        var enumeration = $active.domain.findElementByID(enumerationID);
        $active.panelItem.setEnumeration(enumeration);

        $("#panelItemTargetNameA-" + $active.panelItem.id).text(enumeration.name);
        $("#selectElementM").modal('hide');
    });
    $("#selectElementM").modal();
}

function selectRelationship(event) {
    var panelItemID = getIDfromSelectEvent(event);

    var relationships = $active.pageView.parent.getRelationships();
    if (!relationships || relationships.length < 1) {
        createModal("Warning", "Entity '" + $active.pageView.parent.name + "' does not contain Relationships!");
        return;
    }
    var rows = "<thead><tr><th>Relationship</th><th>Description</th><th></th><th></thead>";
    relationships.forEach(function(relationship) {
        rows += "<tr class='element-selection-row' data-relationship='" + relationship.id + "' data-pitem='" + panelItemID + "'>" +
            "<td>" + relationship.name + "</td>" +
            "<td>" + relationship.desc + "</td>" +
            "<td><span class='glyphicon glyphicon-circle-arrow-right'></span></td>" +
            "</tr>";
    });
    $("#selectElement_ElementsT").html($("<tbody>" + rows + "</tbody>"));

    $active.panelItem = $active.domain.findElementByID(panelItemID);
    $(".element-selection-row").click(function() {
        var relationshipID = $(this).data("relationship");
        var relationship = $active.domain.findElementByID(relationshipID);

        $active.panelItem.setRelationship(relationship);
        $("#panelItemTargetNameA-" + $active.panelItem.id).text(relationship.name);

        // Un-Set View, since this might belong to different relationship
        $active.panelItem.setView(null);
        $("#panelItemTargetViewNameA-" + $active.panelItem.id).text("undefined");

        $("#selectElementM").modal('hide');
    });
    $("#selectElementM").modal();
}

function selectView(event) {
    var panelItemID = getIDfromSelectEvent(event);
    var panelItem = $active.domain.findElementByID(panelItemID);
    if (!panelItem.hasRelationship()) {
        createModal("Warning", "Select target relationship first!");
        return;
    }
    var relationship = panelItem.getRelationship();
    if (!relationship.hasTargetEntity()) {
        createModal("Warning", "Selected relationship does not have a target entity!");
        return;
    }
    var targetEntity = relationship.getTargetEntity();

    var views = targetEntity.getViews();
    if (!views || views.length < 1) {
        createModal("Warning", "Entity '" + targetEntity.name + "' does not contain view definitions!");
        return;
    }
    var rows = "<thead><tr><th>Relationship</th><th>Description</th><th></th><th></thead>";
    views.forEach(function(view) {
        rows += "<tr class='element-selection-row' data-view='" + view.id + "' data-pitem='" + panelItemID + "'>" +
            "<td>" + view.name + "</td>" +
            "<td>" + view.desc + "</td>" +
            "<td><span class='glyphicon glyphicon-circle-arrow-right'></span></td>" +
            "</tr>";
    });
    $("#selectElement_ElementsT").html($("<tbody>" + rows + "</tbody>"));

    $active.panelItem = $active.domain.findElementByID(panelItemID);
    $(".element-selection-row").click(function() {
        var viewID = $(this).data("view");
        var view = $active.domain.findElementByID(viewID);
        $active.panelItem.setView(view);

        $("#panelItemTargetViewNameA-" + $active.panelItem.id).text(view.parent.name + "::" + view.name);
        $("#selectElementM").modal('hide');
    });
    $("#selectElementM").modal();
}
