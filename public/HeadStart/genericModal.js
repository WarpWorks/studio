function createModal(title, message, messageType, actions) {
    var mType = messageType || "info";

    $("#genericModalTitleH").text(title);
    $("#genericModalMessageD").html(message);

    $("#genericModalButtonsD").empty();
    if (!actions) {
        $("#genericModalButtonsD").html("<button type='button' class='btn btn-default' data-dismiss='modal'>OK</button>");
    } else {
        actions.forEach(function(action) {
            var dismiss = action.close ? "data-dismiss='modal'" : "";
            var button = $("<button type='button' class='btn btn-default' " + dismiss + ">" + action.label + "</button>");
            button.on("click", action.callback);
            $("#genericModalButtonsD").append(button);
        });
    }
    $("#genericModalM").modal();
}
