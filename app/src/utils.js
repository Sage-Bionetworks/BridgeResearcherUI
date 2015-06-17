var ko = require('knockout');
var EventEmitter = require('events');

/**
 * Common utility methods for ViewModels.
 *
 * TODO: Add dirty state tracking to the observables that are created.
 * TODO: eventbus works but come up with a one method dialog-specific method
 */
module.exports = {
    eventbus: new EventEmitter(),
    /**
     * A start handler called before a request to the server is made. All errors are cleared
     * and a loading indicator is shown. This is not done globally because some server requests
     * happen in the background and don't signal to the user that they are occurring.
     * @param vm
     * @param event
     */
    startHandler: function(vm, event) {
        event.target.classList.add("loading");
        if (vm.errorFields) {
            vm.errorFields.removeAll();
        }
        if (vm.message) {
            vm.message("");
        }
    },
    /**
     * An Ajax success handler for a view model that supports the editing of a form.
     * Turns off the loading indicator on the button used to submit the form, and
     * clears error fields.
     * @param vm
     * @param event
     * @returns {Function}
     */
    successHandler: function(vm, event) {
        return function(response) {
            event.target.classList.remove("loading");
            if (vm.errorFields) {
                vm.errorFields.removeAll();
            }
            return response;
        }
    },
    /**
     * An ajax failure handler for a view model that supports the editing of a form.
     * Turns off the loading indicator, shows a global error message if there is a message
     * observable, and adds any error fields to an errorFields array, which is used to
     * mark fields that are invalid in the UI.
     * @param vm
     * @param event
     * @returns {Function}
     */
    failureHandler: function(vm, event) {
        return function(response) {
            var json = response.responseJSON;
            event.target.classList.remove("loading");
            if (vm.message) {
                vm.message({text:json.message, 'status': 'error'});
            }
            if (vm.errorFields) {
                if (json.errors) {
                    vm.errorFields.pushAll(Object.keys(json.errors));
                } else {
                    vm.errorFields.removeAll();
                }
            }
            return response;
        }
    },
    /**
     * Create an observable for each field name provided.
     * @param vm
     * @param fields
     */
    observablesFor: function(vm, fields) {
        for (var i=0; i < fields.length; i++) {
            var name = fields[i];
            vm[name] = ko.observable("");
        }
    },
    /**
     * Given a model object, update all the observables for each field name provided.
     * You will need to call utils.observablesFor() with these fields first.
     *
     * @param vm
     * @param object
     * @param fields
     */
    valuesToObservables: function(vm, object, fields) {
        for (var i=0; i < fields.length; i++) {
            var name = fields[i];
            vm[name](object[name]);
        }
    },
    /**
     * Copy all the values of all the observables (presumably updated) back to the model object.
     * @param vm
     * @param object
     * @param fields
     */
    observablesToObject: function(vm, object, fields) {
        for (var i=0; i < fields.length; i++) {
            var name = fields[i];
            object[name] = vm[name]();
        }
    }
}
