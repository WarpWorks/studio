function getDomainData(afterLoad) {
    var domain = window.location.pathname.split('/').pop();

    $.ajax({
        url: '/api/domain/' + domain,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: function (result) {
            if (result.success) {
                $active = {}; // Remove old settings
                $active.domain = get_Domain_fromJSON(result.domain);

                console.log("Loaded: " + $active.domain.name);
                if (afterLoad) {
                    afterLoad();
                }
            }
            else {
                alert(result.err);
            }
        },
        error: function (result) {
            alert("GET: Error - could not load domain: " + domain);
        }
    });
}

function postDomainData() {
    // Prepare request object
    var reqData = {domainData: JSON.stringify($active.domain, null, 2), domainName: $active.domain.name};
    console.log("postDomainData for: " + reqData.domainName);
    //console.log(reqData.domainData);
    reqData = JSON.stringify(reqData, null, 2)

    // Post to server
    $.ajax({
        url: '/api/saveDomain',
        type: 'POST',
        data: reqData,
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (result) {
            if (result.success) {
                console.log("Save: OK");
                if (result.warnings) {
                    createModal ("Saving: "+$active.domain.name, result.status, "warning", null);
                }
            }
            else {
                console.log("Failed to save Domain!");
            }
        },
        error: function () {
            console.log("Error while saving Domain!");
        }
    });
}

function generateDefaultViews() {
    // Prepare request object
    var reqData = {domainName: $active.domain.name};
    console.log("generateDefaultViews for: " + reqData.domainName);
    reqData = JSON.stringify(reqData, null, 2)

    // Post to server
    $.ajax({
        url: '/api/generateDefaultViews',
        type: 'POST',
        data: reqData,
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (result) {
            loadDomainOverview(); // Re-load model, since it was extended on the server side!
            if (result.success) {
                $("#testAppStatusD").html("<div class='alert alert-info'><strong>OK:</strong> Successfully generated Default Views</div>");
            }
            else {
                $("#testAppStatusD").html("<div class='alert alert-danger'><strong>Error:</strong> Failed to generated default views!</div>");
            }
        },
        error: function () {
            console.log("Error while generating default views!");
        }
    });
}

function createDefaultViews() {
    // Prepare request object
    var reqData = {domainName: $active.domain.name};
    console.log("createDefaultViews for: " + reqData.domainName);
    reqData = JSON.stringify(reqData, null, 2)

    // Post to server
    $.ajax({
        url: '/api/createDefaultViews',
        type: 'POST',
        data: reqData,
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (result) {
            loadDomainOverview(); // Re-load model, since it was extended on the server side!
            if (result.success) {
                console.log("Successfully generated Default Views");
            }
            else {
                console.log("Failure generating Default Views!");
            }
        },
        error: function () {
            console.log("Error while generating default views!");
        }
    });
}


function generateTestData() {
    // Update quantity data
    var cnt = $active.domain.updateQuantityData();

    var callbacks = [
        { close: false, label: "Edit Quantity Structure", callback: quantityStructure },
        { close: true, label: "Cancel"}
    ];
    if (cnt<2) {
        createModal ("Warning", "Please go to the menu 'Quantity Structure' and select meaningful values before generating test data!", "warning", callbacks);
        return;
    }

    // Prepare request object
    var reqData = {domainName: $active.domain.name};
    console.log("generateTestData for: " + reqData.domainName);
    reqData = JSON.stringify(reqData, null, 2);

    // Post to server
    $.ajax({
        url: '/api/generateTestData',
        type: 'POST',
        data: reqData,
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (result) {
            if (result.success) {
                $("#testAppStatusD").html("<div class='alert alert-info'><strong>OK:</strong> Successfully started generation of test data ("+cnt+" entities)</div>");
            }
            else {
                $("#testAppStatusD").html("<div class='alert alert-danger'><strong>Error:</strong> Failed to generate test data!</div>");
            }
        },
        error: function () {
            console.log("Error while generate test data!");
        }
    });
}

function removeTestData() {
    // Prepare request object
    var reqData = {domainName: $active.domain.name};
    console.log("removeTestData for: " + reqData.domainName);
    reqData = JSON.stringify(reqData, null, 2)

    // Post to server
    $.ajax({
        url: '/api/removeTestData',
        type: 'POST',
        data: reqData,
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (result) {
            if (result.success) {
                $("#testAppStatusD").html("<div class='alert alert-info'><strong>OK:</strong> Successfully removed test data</div>");
            }
            else {
                $("#testAppStatusD").html("<div class='alert alert-danger'><strong>Error:</strong> Failed to remove test data!</div>");
            }
        },
        error: function () {
            console.log("Error while removing test data!");
        }
    });
}
