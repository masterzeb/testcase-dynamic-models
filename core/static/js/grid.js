function getColumn(div) {
    var index = div.parents("tr:first").find("td").index(div.parents("td:first"));
    return div.parents("table:first").find("th").filter(":eq({0})".format(index));    
}


function createInput(div, options) {
    options = options || {};
    var column = getColumn(div);
    var container = div.parent()
    
    var input = $("<input/>", {
        id: "id_" + column.data().id,
        name: column.data().id,
        value: div.text(),
        width: column.width() - 80
    }).appendTo(container)

    if (options.setup) {
        $.proxy(options.setup, input[0])();
    }
    if (column.data().type == "date") {
        setupDateInput(input, $.extend({dateFormat: column.data().format}, options.date));
    }
    return input
}


function setupDateInput(input, options) {
    input.dateEntry($.extend({
        dateFormat: options.dateFormat[1],
        spinnerImage: ''
    }, options.dateentry));

    input.datepicker($.extend({
        dateFormat: options.dateFormat[0]
    }, options.datepicker));
}


function cellClickHandler() {
    var div = $(this);
    var column = getColumn(div);

    var input = createInput(div, {
        setup: function() {
            $(this).keydown(inputKeydownHandler);
            if (column.data().type != "date") $(this).blur(inputBlurHandler);
        }
    });
    
    if (column.data().type == "date") {
        input.datepicker("option", "onClose", function() {
            $.proxy(inputBlurHandler, input[0])();
        })
    }

    div.toggle();
    input.focus();
}


function inputBlurHandler(event) {
    var input = $(this);
    var div = $(this).parent().find("div.represent");
    var cells = $("#data tr:not(.deleting) td div")
    
    function focusInvalidInput() {
        input.focus();
    }

    cells.unbind("click", cellClickHandler);

    function setCellsClickHandler(handler) {
        handler = handler || cellClickHandler;
        cells
    }

    if (div.text() != input.val()) {
        cells.unbind("click", focusInvalidInput);

        if (!input.valid()) {
            cells.on("click", focusInvalidInput);
            return
        }
        else {
            input.parents("form:first").submit();
            div.text(input.val());
        }
    }

    cells.on("click", cellClickHandler);
    div.toggle();
    input.remove();
}


function inputKeydownHandler(event) {
    var hasDatepicker = $(this).hasClass("hasDatepicker")
    if (event.keyCode == 9) {
        event.preventDefault();
        event.stopImmediatePropagation();
        $.proxy(tabKeyHandler, this)();
        if (hasDatepicker) $(this).datepicker("hide");
    }
    else if (event.keyCode == 13) {
        event.stopImmediatePropagation();
        $(this).blur();
    }
    
    if (event.ctrlKey) {
        if ([82, 90].indexOf(event.keyCode) != -1) {
            event.preventDefault();
            switch (event.keyCode) {
                case 90:
                    $(this).val($(this).parent().find("div.represent").text());
                    break
                case 82:
                    if (hasDatepicker) $(this).datepicker("setDate", new Date(1, 0, 1));
                    else $(this).val("")
                    break
            }
        }
    }
}


function tabKeyHandler() {
    var cell;
    var td = $(this).parents("td:first")
    var tr = td.parent();

    if (tr.find("td:last").is(td)) {
        var table = tr.parents("table:first");
        if (table.find("tr:last").is(tr)) {
            cell = table.find("td:first");
        }
        else {
            cell = tr.next("tr:visible").find("td:first");
        }
    }
    else {
        var index = tr.find("td").index(td) + 1;
        cell = tr.find("td:eq({0})".format(index))
    }
    
    $(this).blur();
    cell.find("div").click();
}
