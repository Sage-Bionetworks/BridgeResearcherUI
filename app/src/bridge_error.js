import utils from './utils';

/**
 * Creates an object structure similar to an EntityNotFoundException sent from the 
 * server. Can be used for client-side validation (although we rarely do this, 
 * leaving most of it to the server for now).
 */
export default class BridgeError {
    constructor() { 
        this.status = 400;
        this.responseJSON = {
            errors: {}
        };
    }
    addErrorIf(test, fieldName, message) {
        if (!!test) {
            this.addError(fieldName, message);
        }
    }
    displayErrors() {
        if (this.hasErrors()) {
            utils.failureHandler()(this);
            return true;
        }
        return false;
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
