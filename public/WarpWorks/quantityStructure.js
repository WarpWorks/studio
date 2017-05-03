//
// JavaScript for quantityStructure.hbs
//

var $active = {};
$active.domain = null;

$(document).ready(function() {
    $('#entityGraphA').click(handleUpdateEvent);

    $.ajax({
        headers: {
            accept: 'application/hal+json'
        },
        success: function(result) {
            $active._links = result._links;

            getDomainData(function() {
                updateQSTable();
                updateMyNavBar();
            });
        },
        error: function(err) {
        }
    });
});

function handleUpdateEvent() {
    saveCurrentFormValues();
    updateQSTable();
}

function updateQSTable() {
    console.log("Updating");
    var total = formatInteger($active.domain.updateQuantityData());
    var table = "<table class='table'> <thead> <tr><th>Entity (Quantities)</th><th>Aggregation</th><th>Child Entity</th><th>Average # of Children</th></tr></thead><tbody>";
    for (var i in $active.domain.entities) {
        var entity = $active.domain.entities[i];
        var isFirst = true;
        var dName = entity.name + " (" + formatInteger(entity.quantity) + ")";
        if (entity.isRootInstance)
            dName = "#" + dName;
        if (entity.isDocument())
            dName = " <span class='glyphicon glyphicon-file'></span> "+dName;
        else
            dName = " <span class='glyphicon glyphicon-list'></span> "+dName;
        var aggs = entity.getAggregations();
        if (aggs.length === 0) {
            table += "<tr><td>" + dName + "</td><td></td><td></td><td></td></tr>";
        }
        for (var j in aggs) {
            var rel = aggs[j];
            var pName = "";
            if (isFirst) {
                isFirst = false;
                pName = dName;
            }
            table += "<tr><td>" + pName + "</td>" +
                "<td>" + rel.name + "</td>" +
                "<td>" + rel.targetEntity[0].name + "</td>" +
                "<td><input type='text' class='form-control' id='" + rel.id + "' value='" + rel.targetAverage + "'></td></tr>";
        }
    }
    table += "<tr bgcolor='#eee8aa'><td><strong>Total: " + total + "</strong></td><td></td><td></td><td></td></tr>";

    table += "<tr><td>Definition of 'Many':</td><td><input type='text' class='form-control' id='defnOfManyI' value='" + $active.domain.definitionOfMany + "'></td><td></td><td></td></tr>";

    table += "</tbody></table>";
    $("#qsTableD").html(table);
}

function optimizeClustering() {
    saveCurrentFormValues();
    $active.domain.updateQuantityData();
    for (var i in $active.domain.entities) {
        var entity = $active.domain.entities[i];
        var allParentAggs = entity.getAllParentAggregations();
        var maxAvg = 0;
        for (var j in allParentAggs) {
            var avg = allParentAggs[j].targetAverage;
            maxAvg = Math.max(avg, maxAvg);
        }
        if (entity.isRootInstance)
            entity.entityType = "Document";
        else
            entity.entityType = maxAvg >= $active.domain.definitionOfMany ? "Document" : "Embedded";
    }
    updateQSTable();
}

function saveCurrentFormValues() {
    for (var i in $active.domain.entities) {
        var entity = $active.domain.entities[i];
        for (var j in entity.relationships) {
            var rel = entity.relationships[j];
            if (rel.isAggregation) {
                var inp = $("#" + rel.id);
                var newAvg = inp.val();
                if (!isNaN(newAvg)) {
                    rel.targetAverage = parseInt(newAvg);
                }
            }
        }
    }
    $active.domain.definitionOfMany = parseInt($("#defnOfManyI").val());
}

function updateMyNavBar() {
    var home = [
        "Domain: " + $active.domain.name + " <span class='glyphicon glyphicon-arrow-left'></span>",
        $active._links.domain.href
    ];
    updateNavBar(home, null, null, saveEvent, domainCancelEvent, null);
}

function postDomainDataToServer() {
    // Save last changes from form => $active.domain
    saveCurrentFormValues();

    // Post to server
    postDomainData();
}

function saveEvent() {
    handleUpdateEvent();
    postDomainDataToServer();
}

function domainCancelEvent() {
    getDomainData(function() {
        updateQSTable();
    });
}

function formatInteger(i) {
    return isNaN(i)?"":i.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}