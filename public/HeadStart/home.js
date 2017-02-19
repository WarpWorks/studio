$(document).ready(function () {
    console.log("Ready");
    $active = {};

    updateNavBar (["HeadStart", "#"]);

    $("#domainWizardB").click(function() {
        $("#domainWizardM").modal();
    });

    initializeSMNWizard();
    updateDomainOverview();
    updateSMNExamples();
});

function initializeSMNWizard() {
    $("#wizardAddEntityB").on("click", function () {
        $("#wizardFormDataT").val($("#wizardFormDataT").val()+
            "\n// Basic Entity Definitions:"+
            "\nCustomer: DoB:date, FirstName, LastName"+
            "\nProduct: productID:string, stock:number, isOnSale:boolean"+
            "\nOrder: quantity:number, payment:[PayPal|CreditCard]");
    });
    $("#wizardAddInheritanceB").on("click", function () {
        $("#wizardFormDataT").val(
            $("#wizardFormDataT").val()+
            "\nEnterprise(Customer): VATID");
    });
    $("#wizardAddAggB").on("click", function () {
        $("#wizardFormDataT").val(
            $("#wizardFormDataT").val()+
            "\n"+
            "\n// Aggregation Hierarchy:"+
            "\nCustomer: {myOrders:Order*}");
    });
    $("#wizardAddAssocB").on("click", function () {
        $("#wizardFormDataT").val(
            $("#wizardFormDataT").val()+
            "\n"+
            "\n// Associations:"+
            "\nOrder: products=>Product");
    });
    $("#wizardAddDomainB").on("click", function () {
        $("#wizardFormDataT").val(
            "// Domain:"+
            "\n#MyShop: {Customer*, Product*}"+
            "\n"+
            $("#wizardFormDataT").val());
    });

}

function updateDomainOverview () {
    $.ajax({
        url: '/api/availableDomains',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: function (result) {
            if (result.success) {
                $("#domainOverviewLG").empty();
                $("#domainOverviewLG").append(
                    "<a href='#' class='list-group-item active'><h4 class='list-group-item-heading'>Available Domains</h4></a>");
                result.domains.forEach(function (domain) {
                    var elem = $(
                        "<a href='#' class='list-group-item' id=" + domain.name + "><h4 class='list-group-item-heading'>" + domain.name + "</h4>" +
                        // TBD: "<p class='list-group-item-text'>" + elem.desc + "</p>" +
                        "</a>");
                    $("#domainOverviewLG").append(elem);
                    elem.click(function () {
                        window.location.href = "domain/"+$(this).attr("id");
                    });
                });
            }
            else {
                console.log("GET: Could not get domain overview!");
            }
        },
        error: function () {
            console.log("GET: Error - could not get domain overview!");
        }
    });
}

function marketplace() {
    console.log("ok!")
    window.location.href = "./marketplace";
}

function newDomain () {
    window.location.href = "domain/New_Domain";
}

function updateSMNExamples () {
    $.ajax({
        url: '/api/smnExamples',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: function (result) {
            if (result.success) {
                $active.smnExamples = {};
                $("#SMNExamplesUL").empty();
                if (result.smnExamples) result.smnExamples.forEach(function (smnExample) {
                    $active.smnExamples[smnExample.name] = smnExample;
                    var elem = $("<li id='"+smnExample.name+"'><a href='#'>"+smnExample.name+"</a></li>");
                    $("#SMNExamplesUL").append(elem);
                    elem.click(function () {
                        var smn = $(this).attr("id");
                        console.log("Using: "+$active.smnExamples[smn].name);
                        $("#wizardFormDataT").val($active.smnExamples[smn].template);
                    });
                });
            }
            else {
                console.log("GET: Could not get SMNExamples!");
            }
        },
        error: function () {
            console.log("GET: Could not get SMNExamples - Server Error!");
        }
    });
}

function wizardClearForm () {
    console.log("ok");
    $("#wizardFormDataT").val("");
}
function wizardCreateDomain (evt) {
    var smn = {};
    smn.value = $("#wizardFormDataT").val();

    // TBD: evt.preventDefault(); => Required here?

    $.ajax({
        url: '/api/createDomainFromSMN',
        type: 'POST',
        data: JSON.stringify(smn),
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (result) {
            if (result.success) {
                console.log("New Domain: "+result.newDomain);
                window.location.href = "domain/"+result.newDomain;
            }
            else {
                $("#wizardStatusD").html("<div class='alert alert-danger'><strong>Error: </strong>"+result.error+"</div>");
            }
        },
        error: function () {
            console.log("Error!");
        }
    });
}
