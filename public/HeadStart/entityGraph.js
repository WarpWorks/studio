//
// JavaScript for entityGraph.hbs
//

var $active = {};
$active.domain = null;

$(document).ready(function() {
    $('#showAllModeI').click(showAllMode);
    $('#entityClusterModeI').click(entityClusterMode);
    $('#redrawB').click(updateGraph);

    $('#aggregationsI').change(updateGraph);
    $('#associationsI').change(updateGraph);
    $('#inheritanceI').change(updateGraph);
    $('#quantitiesI').change(updateGraph);

    $.ajax({
        headers: {
            Accept: 'application/hal+json'
        },
        success: function(result) {
            $active._links = result._links;
            updateDomain();
        },
        error: function(err) {
        }

    });
});

function updateDomain() {
    getDomainData(function() {
        updateNavBar([
            "Domain: " + $active.domain.name + " <span class='glyphicon glyphicon-arrow-left'></span>",
            $active._links.domain.href
        ]);
        $active.domain.updateQuantityData();
        updateGraph();
    });
}

graphMode = "showAll";
function entityClusterMode() {
    graphMode = "entityCluster";
    updateGraph();
}

function showAllMode() {
    graphMode = "showAll";
    updateGraph();
}

function updateGraph() {
    var showAggregations = $("#aggregationsI").prop("checked");
    var showAssociations = $("#associationsI").prop("checked");
    var showInheritance = $("#inheritanceI").prop("checked");
    var showQuantities = $("#quantitiesI").prop("checked");

    // create one array with nodes and one with edges
    var nodeArray = [];
    var edgeArray = [];
    // console.log("*******************************************************************");
    // console.log(JSON.stringify($active.domain, null, 2));
    // console.log("*******************************************************************");

    // Set default styles
    $active.domain.entities.forEach(function(entity) {
        entity.borderWidth = 1;
        entity.color = "lightgrey";
    });

    var entities = null;

    if (graphMode === "entityCluster") {
        // Put active entity at the center:
        if (!$active.entity) {
            $active.entity = $active.domain.getRoot();
        }
        $active.entity.borderWidth = 2;
        $active.entity.color = "darkgrey";
        entities = [$active.entity];
        console.log("Active Entity:" + $active.entity.name);

        // Add child aggregations:
        var childAggs = $active.entity.getAggregations();
        for (var i in childAggs) {
            console.log("Child Entity:" + childAggs[i].getTargetEntity().name);
            entities.push(childAggs[i].getTargetEntity());
        }

        // Add parent aggregations:
        var parentAggs = $active.entity.getAllParentAggregations();
        for (var i in parentAggs) {
            console.log("Parent Entity:" + parentAggs[i].parent.name);
            entities.push(parentAggs[i].parent);
        }

        // Add parent class:
        if ($active.entity.hasParentClass()) {
            console.log($active.entity.name + " has parent " + $active.entity.getParentClass().name);
            entities.push($active.entity.getParentClass());
        }

        // Add derived classes:
        entities = entities.concat($active.entity.getAllDerivedEntities());
    } else {
        // Show all entities
        entities = $active.domain.entities;
    }

    entities.forEach(function(entity, idx1) {
        // console.log("*** Entity: " + entity.name);

        // Add entity
        var name = entity.isRootInstance ? "#" + entity.name : entity.name;
        if (showQuantities) {
            name += "\n(" + entity.quantity.toLocaleString() + ")";
        }
        nodeArray.push({
            id: entity.id,
            label: name,
            borderWidth: entity.borderWidth,
            color: entity.color
        });

        // Now add edges for aggregations and associations for this entity
        if (entity.relationships) {
            entity.relationships.forEach(function(relationship, idx2) {
                var from = entity.id;
                var to = relationship.getTargetEntity().id;
                var id = idx1 + ':' + idx2;
                var lbl = relationship.isAggregation ? "x" + relationship.targetAverage : "";
                // console.log("Adding: " + entity.name + " => " + relationship.getTargetEntity().name + "(" + relationship.isAggregation + ")");
                // console.log("From " + from + ", to " + to);

                if (showAggregations && relationship.isAggregation) {
                    edgeArray.push({
                        from: from,
                        to: to,
                        id: id,
                        label: showQuantities ? lbl : "",
                        dashes: false,
                        arrows: "from",
                        smooth: true
                    });
                }
                if (showAssociations && !relationship.isAggregation) {
                    edgeArray.push({
                        from: from,
                        to: to,
                        id: id,
                        label: showQuantities ? lbl : "",
                        dashes: true,
                        smooth: true
                    });
                }
            });
        }
        if (showInheritance && entity.hasParentClass()) {
            var from = entity.id;
            var to = entity.getParentClass().id;
            var id = '_' + idx1;
            edgeArray.push({
                from: from,
                to: to,
                id: id,
                color: 'orange',
                arrows: "to",
                dashes: true,
                smooth: true
            });
        }
    });

    var nodes = new vis.DataSet(nodeArray);
    var edges = new vis.DataSet(edgeArray);

    // console.log("Nodes:");
    // console.log(JSON.stringify(nodes, null, 2));
    // console.log("Edges:");
    // console.log(JSON.stringify(edges, null, 2));

    // create a network
    var container = document.getElementById('mynetwork');

    // provide the data in the vis format
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        width: "800px",
        height: "500px",
        interaction: {
            navigationButtons: true,
            keyboard: true
        }
    };

    // initialize your network!
    var network = new vis.Network(container, data, options);

    // Events
    if (graphMode === "entityCluster") {
        network.on("click", function(params) {
            $active.entity = $active.domain.findElementByID(params.nodes[0]);
            updateGraph();
        });
    }
}
