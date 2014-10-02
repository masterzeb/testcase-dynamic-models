function toggleActions() {
    $(".actions button").toggle();
}


function initButton(options) {
    function cleanup() {
        if (options.cleanup) options.cleanup();
        toggleActions();
    }

    $(options.selector).click(function() {
        options.prepare(cleanup);

        $("#confirm-button").unbind("click").click(function() {
            options.confirm(cleanup);
        });

        $("#cancel-button").unbind("click").click(function() {
            options.cancel ? options.cancel(cleanup) : cleanup();
        });
    });
}

function initAddButton() {
    function clear(cleanup) {
        $("#data table tbody tr:last").fadeOut('fast', function() {
            $(this).remove();
        })
        $("#data table td div").on("click", cellClickHandler);
        cleanup();
    }

    initButton({
        selector: "#add-button",
        prepare: function(cleanup) {
            var tr = $("table tbody tr:eq(0)").clone().hide().appendTo($("#data table"));
            $.each(tr.find("td div.represent"), function() {
                createInput($(this))
                $(this).remove();
            })

            tr.fadeIn('fast');
            tr.find("input:first").focus();
            $("#data table td div").unbind("click");
            
            setupForm($("#data form"), {
                ajax: {
                    url: "/add_data",
                    beforeSubmit: function(data, form) {
                        data.push({name: "model_name", value: getCurrentModelName()})
                    },
                    success: function(response) {
                        if (response.success) {
                            var tr = $("#data table tbody tr:last");
                            tr.attr("data-pk", response.id);
    
                            $.each(tr.find("input"), function() {
                                $("<div/>", {
                                    class: "represent",
                                    text: $(this).val()
                                }).insertBefore($(this));
                    
                                $(this).remove();
                            })
                            $("#data table td div").on("click", cellClickHandler);
                            cleanup();
                        }
                        else clear(cleanup);
                    },
                    error: function() {
                        clear(cleanup);
                    }
                },
                validate: {
                    focusCleanup: true
                }
            })
        },
        cleanup: function() {
            setupForm();
            $(".actions").fadeIn('fast');
        },
        confirm: function(cleanup) {
            var form = $("#data form");
            if (form.valid()) {
                $(".actions").fadeOut('fast');
                form.submit();
            }
        },
        cancel: clear
    })   
}


function initDelButton() {
    initButton({
        selector: "#del-button",
        prepare: function() {
            $.each($("#data table tr"), function(index) {
                var td = $("<td/>").prependTo($(this));
                var input = $("<input/>", {type: "checkbox"}).appendTo(td);
                if (!index) input.click(function() {
                    $("#data tr:visible td:nth-child(1) input:checkbox:gt(0)")
                        .prop("checked", $(this).prop("checked"));
                })
            })            
        },
        cleanup: function() {
            $("#data table td:nth-child(1)").remove();
            $(".actions").fadeIn('fast');
        },
        confirm: function(cleanup) {
            $(".actions").fadeOut('fast');

            var pks = [];
            var checkboxes = $("#data tr:visible td:nth-child(1) input:checkbox:gt(0)")
                .filter(":checked")
            
            $.each(checkboxes, function() {
                var tr = $(this).parents("tr:first");
                tr.addClass("deleting");
                tr.fadeOut("fast", function() {
                    if (!$(this).hasClass("deleting")) $(this).show();
                });
                pks[pks.length] = tr.data().pk;
            })
            
            $.ajax($.extend({}, ajaxDefaults, {
                url: "/delete_data",
                data: {pks: pks, model_name: getCurrentModelName()},
                success: function(response) {
                    var trs = $("tr.deleting");
                    response.success ? trs.remove() : trs.removeClass("deleting").show();
                    cleanup();
                },
                error: function() {
                    $("tr.deleting").removeClass("deleting").show(cleanup);
                }
            }))
            
        }
    })    
}


function initActions() {   
    $(".actions button").hover(function() {$(this).toggleClass("ui-state-hover")})
    $(".actions button").click(toggleActions);
    initAddButton();
    initDelButton();
}
