function BridgeError() {
    this.status = 400;
    this.responseJSON = {
        errors: {}
    };
}
BridgeError.prototype = {
    addError: function(fieldName, message) {
        var e = this.responseJSON.errors;
        e[fieldName] = e[fieldName] || [];
        e[fieldName].push(fieldName + " " + message);
    },
    hasErrors: function() {
        return Object.keys(this.responseJSON.errors).length > 0;
    }
};

module.exports = BridgeError;