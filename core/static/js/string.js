if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

String.prototype.trim = function(ch) {
    var r = new RegExp("^{0}+|{0}+$".format(ch || "\\s"), "g");
    return this.replace(r, "");
};

String.prototype.ltrim = function(ch) {
    var r = new RegExp("^{0}+".format(ch || "\\s"));
    return this.replace(r, "");
};


String.prototype.rtrim = function(ch) {
    var r = new RegExp("{0}+$".format(ch || "\\s"))
    return this.replace(r, "");
};
