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
    var total = $active.domain.updateQuantityData();
    var table = "<table class='table'> <thead> <tr><th>Entity: Instances</th><th>Aggregations</th><th>Child Entities</th><th>Average # of Children</th></tr></thead><tbody>";
    for (var i in $active.domain.entities) {
        var entity = $active.domain.entities[i];
        var isFirst = true;
        var aggs = entity.getAggregations();
        if (aggs.length === 0) {
            table += "<tr><td>" + entity.name + ": " + entity.quantity + "</td><td></td><td></td><td></td></tr>";
        }
        for (var j in aggs) {
            var rel = aggs[j];
            var pName = "";
            if (isFirst) {
                pName = entity.name + ": " + entity.quantity;
                if (entity.isRootInstance) {
                    pName = "#" + pName;
                }
                isFirst = false;
            }
            table += "<tr><td>" + pName + "</td>" +
                "<td>" + rel.name + "</td>" +
                "<td>" + rel.targetEntity[0].name + "</td>" +
                "<td><input type='text' class='form-control' id='" + rel.id + "' value='" + rel.targetAverage + "'></td></tr>";
        }
    }
    table += "<tr><td><strong>Total: " + total + "</strong></td><td></td><td></td><td></td></tr>";

    table += "</tbody></table>";
    $("#qsTableD").html(table);
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
                    rel.targetAverage = newAvg;
                }
            }
        }
    }
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
