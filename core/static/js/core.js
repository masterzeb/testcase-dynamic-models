var ajaxDefaults = {
    type: "POST",
    dataType: "json",
    beforeSend: function(xhr, settings) {
        xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken'));
    },
}


function getCurrentModelName() {
    return $("#models-list li.active").data().modelName
}


$(function() {
    initActions();
    $("#models-list li").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
    
        $("#content").fadeOut(250, function() {
            var dataInnerWidth = ($("body").width() - $("#models-list").width() - 100);
            $("#models-data h5.hint").hide();
            $("#data").empty();
            
            $.ajax($.extend({}, ajaxDefaults, {
                url: "/get_model_data",
                requestType: "POST",
                data: {model_name: getCurrentModelName()},
                success: function(response) {
                    createForm(response);
                    setupForm();

                    $("<table/>", {
                        cellspacing: 0,
                        cellpadding: 0
                    }).appendTo($("#data form"));
                    $("<thead/>").appendTo($("#data table"));
                    $("<tr/>").appendTo($("#data table thead"));
                    
                    $.each(response.struct, function() {
                        var th = $("<th/>", {
                            text: this.verbose_name || this.id,
                            width: dataInnerWidth / response.struct.length,
                            "data-id": this.id,
                            "data-type": this.type,
                        }).appendTo($("#data table tr:first"))
                        if (this.format) th.data("format", this.format.slice(1));
                    })
                    
                    $("<tbody/>").appendTo($("#data table"));
                    $.each([{id: 0}].concat(response.data), function() {
                        $("<tr/>", {
                            "data-pk": this.id
                        }).appendTo($("#data table tbody"));
                        
                        var obj = this;
                        $.each(response.struct, function() {
                            var td = $("<td/>").appendTo($("#data tr:last"));
                            var div = $("<div/>", {
                                text: obj[this.id],
                                class: "represent"
                            }).appendTo($("#data td:last"))
                            div.click(cellClickHandler)
                        })
                    })
    
                    if ($("#confirm-button").css("display") != "none") toggleActions();
                    $("#data table tbody tr:first").hide();                
                    $(".actions").show();
                    $("#content").fadeIn();
                }
            }));
        })
    });

    $("#models-data h2 span").click(function() {
        $("#models-data h5.hint").fadeIn('slow', function() {
            var hint = $(this);
            window.setTimeout(function() {
                hint.fadeOut('slow');
            }, 5000)
        })
    })
    $("#models-list li:first").click();
})
