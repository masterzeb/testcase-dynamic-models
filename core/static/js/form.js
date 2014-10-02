function createForm(response) {
    var form = $("<form/>", {
        method: "POST"
    }).appendTo($("#data"));

    form.validateForm({
        rules: response.validation_rules,
        settings: {
            focusCleanup: false,
            errorPlacement: function(error, element) {
                element.before(error);
            }
        }
    });
    return form
}

function setupForm(form, options) {
    form = form || $("#data form");
    options = options || setupFormForUpdate();
    form.ajaxForm($.extend({}, ajaxDefaults, options.ajax))

    for (key in options.validate) {
        form.validate().settings[key] = options.validate[key]
    }
}

function setupFormForUpdate() {
    return {
        ajax: {
            url: "/update_data",
            beforeSubmit: function(data, form) {
                var div = form.find("input").parent().find("div.represent");
                var tr = div.parents("tr:first");
                div.attr("data-old", div.text());
    
                data.push({name: "model_name", value: getCurrentModelName()})
                data.push({name: "pk", value: tr.data().pk})
                data.push({name: "_index", value: tr.find("td").index(div.parent())})
            },
            success: function(response) {
                var div = $("tr[data-pk={0}] td:eq({1}) div"
                    .format(response.pk, response._index))
    
                if (!response.success) {
                    div.text(div.data().old);
                    div.addClass("error").delay(2000).removeClass("error");
                }
                div.removeAttr("data-old");
            },
            error: function() {
                $.each($("div[data-old]"), function() {
                    $(this).text($(this).data().old).removeAttr("data-old");
                })
            }
        },
        validate: {
            focusCleanup: false
        }
    }
}
