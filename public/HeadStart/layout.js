function updateNavBar(home, pageMenuDD, testModalF, saveHandler, cancelHandler, deleteHandler)
{
    if (home) {
        $("#DomainHomeA").html(home[0]);
        $("#DomainHomeA").on("click", function () {
            if (saveHandler) saveHandler.call();
            window.location.href=home[1];
        });
        $("#DomainHomeA").show();
    }
    else
        $("#DomainHomeA").hide();

    // Set up Page Menu
    if (pageMenuDD) {
        var ddContent="";
        pageMenuDD.forEach(function (elem) {
            if (elem[0] === "---")
                ddContent += "<li role='separator' class='divider'></li>"
            else
                ddContent += "<li><a href='#' onclick='"+elem[1]+"'>"+elem[0]+"</a></li>";
        });
        $("#pageMenuDD").html(ddContent);
        $("#pageMenuA").show();
    }
    else
        $("#pageMenuA").hide();

    if (testModalF) {
        $("#TestMenuA").attr("onclick", testModalF);
        $("#TestMenuA").show();
    }
    else {
        $("#TestMenuA").hide();
    }

    // Save/Cancel/Delete-Buttons
    $("#NavButtonSaveA").on("click", saveHandler);
    $("#NavButtonCancelA").on("click", cancelHandler);
    $("#NavButtonDeleteA").on("click", deleteHandler);
    if (saveHandler) $("#NavButtonSaveA").show(); else $("#NavButtonSaveA").hide();
    if (cancelHandler) $("#NavButtonCancelA").show(); else $("#NavButtonCancelA").hide();
    if (deleteHandler)  $("#NavButtonDeleteA").show(); else $("#NavButtonDeleteA").hide();
}
