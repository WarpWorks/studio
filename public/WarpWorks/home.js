$(document).ready(function() {
    $active = {};

    $.ajax({
        // url: './api',
        method: 'GET',
        headers: {
            accept: 'application/hal+json'
        },
        success: function(result) {
            $active._links = result._links;

            $('button[data-url]').click(goToPage);

            updateSMNExamples(result._links['hs:smn-examples'].href);
            updateDomainOverview(result._links['hs:domains'].href);
        },
        error: function(err) {
            console.log("INITIAL: err=", err);
        }
    });

    updateNavBar(["WarpWorks", "#"]);

    $("#domainWizardB").click(function() {
        $("#domainWizardM").modal();
    });

    initializeSMNWizard();
});

function goToPage() {
    window.location.href = $(this).data('url');
}

function initializeSMNWizard() {
    $("#wizardAddEntityB").on("click", function() {
        $("#wizardFormDataT").val($("#wizardFormDataT").val() +
            "\n// Basic Entity Definitions:" +
            "\nCustomer: DoB:date, FirstName, LastName" +
            "\nProduct: productID:string, stock:number, isOnSale:boolean" +
            "\nOrder: quantity:number, payment:[PayPal|CreditCard]");
    });
    $("#wizardAddInheritanceB").on("click", function() {
        $("#wizardFormDataT").val(
            $("#wizardFormDataT").val() +
            "\nEnterprise(Customer): VATID");
    });
    $("#wizardAddAggB").on("click", function() {
        $("#wizardFormDataT").val(
            $("#wizardFormDataT").val() +
            "\n" +
            "\n// Aggregation Hierarchy:" +
            "\nCustomer: {myOrders:Order*}");
    });
    $("#wizardAddAssocB").on("click", function() {
        $("#wizardFormDataT").val(
            $("#wizardFormDataT").val() +
            "\n" +
            "\n// Associations:" +
            "\nOrder: products=>Product");
    });
    $("#wizardAddDomainB").on("click", function() {
        $("#wizardFormDataT").val(
            "// Domain:" +
            "\n#MyShop: {Customer*, Product*}" +
            "\n" +
            $("#wizardFormDataT").val());
    });
}

function updateDomainOverview(url) {
    $.ajax({
        url: url,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: function(result) {
            if (result.success) {
                $("#domainOverviewLG").empty();
                $("#domainOverviewLG").append(
                    "<a href='#' class='list-group-item active'><h4 class='list-group-item-heading'>Available Domains</h4></a>");
                result._embedded.domains.forEach(function(domain) {
                    var elem = $(
                        "<a href='" + domain._links.self.href + "' class='list-group-item' id=" + domain.name + "><h4 class='list-group-item-heading'>" + domain.name + "</h4>" +
                        // TBD: "<p class='list-group-item-text'>" + elem.desc + "</p>" +
                        "</a>");
                    $("#domainOverviewLG").append(elem);
                });
            } else {
                console.log("GET: Could not get domain overview!");
            }
        },
        error: function() {
            console.log("GET: Error - could not get domain overview!");
        }
    });
}

function updateSMNExamples(url) {
    $.ajax({
        url: url,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        success: function(result) {
            if (result.success) {
                $active.smnExamples = {};

                $("#SMNExamplesUL").empty();
                if (result.smnExamples) {
                    result.smnExamples.forEach(function(smnExample) {
                        $active.smnExamples[smnExample.name] = smnExample;
                        var elem = $("<li id='" + smnExample.name + "'><a href='#'>" + smnExample.name + "</a></li>");
                        $("#SMNExamplesUL").append(elem);
                        elem.click(function() {
                            var smn = $(this).attr("id");
                            console.log("Using: " + $active.smnExamples[smn].name);
                            $("#wizardFormDataT").val($active.smnExamples[smn].template);
                        });
                    });
                }
            } else {
                console.log("GET: Could not get SMNExamples!");
            }
        },
        error: function() {
            console.log("GET: Could not get SMNExamples - Server Error!");
        }
    });
}
