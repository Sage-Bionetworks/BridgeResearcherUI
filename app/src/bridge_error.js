/**
 * Creates an object structure similar to an EntityNotFoundException sent from the 
 * server. Can be used for client-side validation (although we rarely do this, 
 * leaving most of it to the server for now).
 */
export default class BridgeError extends Error {
    constructor() { 
        super();
        this.status = 400;
        this.responseJSON = {
            errors: {}
        };
    }
    addError(fieldName, message) {
        var e = this.responseJSON.errors;
        e[fieldName] = e[fieldName] || [];
        e[fieldName].push(fieldName + " " + message);
    }
    hasErrors() {
        return Object.keys(this.responseJSON.errors).length > 0;
    }
}
