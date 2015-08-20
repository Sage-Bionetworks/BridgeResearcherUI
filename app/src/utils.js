var ko = require('knockout');
var EventEmitter = require('./events');
var serverService = require('./services/server_service');

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
        if (vm.messageObs) {
            vm.messageObs("");
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
    // TODO: Very complicated and no longer works.
    failureHandler: function(vm, event) {
        return function(response) {
            event.target.classList.remove("loading");
            if (vm.messageObs) {
                var msg = (response.responseJSON) ? response.responseJSON.message :
                    "There has been an error contacting the server.";
                vm.messageObs({text:msg, 'status': 'error'});
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
    },
    /**
     * Get the list of studies that can be used for authentication
     */
    getStudyList: function(vm) {
        return function(env) {
            vm.messageObs("");
            vm.studyOptions([]);
            document.getElementById("study").disabled = true;
            serverService.getStudyList(env).then(function(studies) {
                studies.items.sort(function(a,b) {
                    return a.name > b.name;
                });
                vm.studyOptions(studies.items);
                document.getElementById("study").disabled = false;
            }).catch(function(response) {
                vm.messageObs({text: response.message, status: 'error'});
            });
        };
    },
    /**
     * Convert a date into a locale-appropriate string (browser-dependent).
     * @param date
     * @returns {string}
     */
    formatDateTime: function(date) {
        if (date) {
            return new Date(date).toLocaleString();
        }
        return "";
    },
    /**
     * Convert a ISO date string ("2010-01-01") to a browser-dependent, local
     * date string, adjusting for the time zone offset on that date, to compensate
     * for the fact that a date without a time is abstract and not expressed
     * relative to a time zone. Otherwise the browser may shift the date to a
     * different day when it localizes the time zone.
     * @param date
     * @returns {*}
     */
    formatDate: function(date) {
        if (date) {
            // Get the declared offset of the local time on the date in question (accounts
            // for daylight savings at right time of year)
            var offset = new Date(date).toString().match(/GMT([^\s]*)/)[1];
            // If offset is +0600, on Safari this fails if you don't insert ':' as in: +06:00
            offset = offset.replace(/00$/,":00");
            // Now force date to a specific datetime, in local time at that time
            var localDate = date + "T00:00:00" + offset;
            // And return only the date portion of that date object
            return new Date(localDate).toLocaleDateString();
        }
        return "";
    }
};
