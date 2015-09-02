var ko = require('knockout');
var EventEmitter = require('./events');
var serverService = require('./services/server_service');
var dialogBus = new EventEmitter();

function is(obj, typeName) {
    return Object.prototype.toString.call(obj) === "[object "+typeName+"]";
}
/**
 * We have to determine this without a source object, because sometimes
 * observables must be set up before we have loaded the object from
 * the server. So fields that are to be array should be postfixed with
 * "[]", as in "elements[]".
 */
function nameInspector(string) {
    var isArray = /\[\]$/.test(string);
    var name = (isArray) ? string.match(/[^\[]*/)[0] : string;
    return {name: name, observerName: name+"Obs", isArray: isArray};
}
function isDefined(obj) {
    return (typeof obj !== "undefined");
}

/**
 * Common utility methods for ViewModels.
 *
 * TODO: Add dirty state tracking to the observables that are created.
 * TODO: bus for event errors that are now just getting logged and not shown to user. Wire to root message panel.
 */
module.exports = {
    is: is,
    isDefined: isDefined,
    /**
     * f(x) = x
     * @param arg
     * @returns {*}
     */
    identity: function(arg) {
        return arg;
    },
    // TODO: This is used by root and no other, and it seems like it should be possible to
    // do root.openDialog(), etc.
    addDialogListener: function(listener) {
        dialogBus.addEventListener('dialogs', listener);
    },
    openDialog: function(dialogName, params) {
        dialogBus.emit('dialogs', dialogName, params);
    },
    closeDialog: function() {
        dialogBus.emit('dialogs', 'close');
    },
    /**
     * A start handler called before a request to the server is made. All errors are cleared
     * and a loading indicator is shown. This is not done globally because some server requests
     * happen in the background and don't signal to the user that they are occurring.
     * @param vm
     * @param event
     */
    startHandler: function(vm, event) {
        event.target.classList.add("loading");
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
    successHandler: function(vm, event, message) {
        return function(response) {
            event.target.classList.remove("loading");
            if (message) {
                vm.messageObs({text:message});
            }
            return response;
        };
    },
    /**
     * An ajax failure handler for a view model that supports the editing of a form.
     * Turns off the loading indicator, shows a global error message if there is a message
     * observable.
     * @param vm
     * @param event
     * @returns {Function}
     */
    failureHandler: function(vm, event) {
        return function(response) {
            event.target.classList.remove("loading");
            if (vm.messageObs) {
                if (response instanceof Error) {
                    vm.messageObs({text:response.message, 'status': 'error'});
                } else if (response.responseJSON) {
                    vm.messageObs({text:response.responseJSON.message, 'status': 'error'});
                } else {
                    // No message, the message component will provide something generic
                    console.error(JSON.stringify(response));
                    vm.messageObs({'status': 'error'});
                }
            }
        };
    },
    /**
     * Create an observable for each field name provided.
     * @param vm
     * @param fields
     * @param [source] - if provided, values will be initialized from this object
     */
    observablesFor: function(vm, fields, source) {
        for (var i=0; i < fields.length; i++) {
            var insp = nameInspector(fields[i]);
            var value = (source) ? source[insp.name] : "";
            if (insp.isArray) {
                vm[insp.observerName] = ko.observableArray(value);
            } else {
                vm[insp.observerName] = ko.observable(value);
            }
        }
    },
    /**
     * Given a model object, update all the observables for each field name provided.
     * Will not attempt to copy if either the observable property or the property on
     * the object, as defined by field, do not exist.
     *
     * @param vm
     * @param object
     * @param fields
     */
    valuesToObservables: function(vm, object, fields) {
        for (var i=0; i < fields.length; i++) {
            var insp = nameInspector(fields[i]);

            var obs = vm[insp.observerName];
            var value = object[insp.name];
            if (isDefined(obs) && isDefined(value)) {
                obs(value);
            }
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
            var insp = nameInspector(fields[i]);

            var obs = vm[insp.observerName];
            var value = object[insp.name];
            if (isDefined(obs) && isDefined(value)) {
                object[insp.name] = obs();
            }
        }
    },
    /**
     * Get the list of studies that can be used for authentication
     */
    // TODO: This could just be in serverService, not utils. Also it knows a
    // lot about the viewModel, factor that out, even at the cost of duplication.
    getStudyList: function(vm) {
        return function(env) {
            vm.messageObs("");
            vm.studyOptions([]);
            serverService.getStudyList(env).then(function(studies) {
                studies.items.sort(function(a,b) {
                    return a.name > b.name;
                });
                vm.studyOptions(studies.items);
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
