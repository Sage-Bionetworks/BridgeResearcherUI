/**
 * Creates an object structure similar to an EntityNotFoundException sent from the 
 * server. Can be used for client-side validation (although we rarely do this, 
 * leaving most of it to the server for now).
 */
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