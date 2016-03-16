var ko = require('knockout');
require('knockout-postbox');
var toastr = require('toastr');
var config = require('./config');
var $ = require('jquery');

var GENERIC_ERROR = "A server error happened. We don't know what exactly. Please try again.";
var pendingControl = null;
toastr.options = config.toastr;

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
function isNotBlank(obj) {
    return (typeof obj !== "undefined") && obj !== null && obj !== "";
}
function isDefined(obj) {
    return (typeof obj !== "undefined");
}
function deleteUnusedProperties(object) {
    if (is(object, 'Array')) {
        for (var i=0; i < object.length; i++) {
            deleteUnusedProperties(object[i]);
        }
    } else if (is(object, 'Object')) {
        for (var prop in object) {
            if (typeof object[prop] === 'undefined' || object[prop] === "" || object[prop] === null) {
                delete object[prop];
            } else {
                deleteUnusedProperties(object[prop]);
            }
        }
    }
}
function makeOptionFinder(arrayOrObs) {
    return function(value) {
        var options = ko.unwrap(arrayOrObs);
        for (var i= 0; i < options.length; i++) {
            var option = options[i];
            if (option.value === value) {
                return option;
            }
        }
    };
}
function makeOptionLabelFinder(arrayOrObs) {
    var finder = makeOptionFinder(arrayOrObs);
    return function(value) {
        var option = finder(value);
        return option ? option.label : "";
    };
}

function displayPendingControl(control) {
    clearPendingControl();
    control.classList.add("loading");
    pendingControl = control;
}
function clearPendingControl() {
    if (pendingControl) {
        pendingControl.classList.remove("loading");
        pendingControl = null;
    }
}
function num(value) {
    return (typeof value !== "number") ? 0 : value;
}
function notBlankName(array, value) {
    if (typeof value !== 'undefined' && value !== '<EMPTY>' && value.length > 0) {
        array.push(value);
    }
}
function formatTitleCase(string) {
    if (string) {
        return string.split(" ").map(function(text) {
            return text.substring(0,1).toUpperCase() + text.substring(1); 
        }).join(" ");
    }
    return '';
}
/**
 * Common utility methods for ViewModels.
 */
module.exports = {
    /**
     * Determine type of object
     * @param object - object to test
     * @param string - the type name to verify, e.g. 'Date' or 'Array'
     */
    is: is,
    /**
     * Is this variable defined?
     * @param object - the variable being tested
     */
    isDefined: isDefined,
    /**
     * Is this variable defined, not null and not blank?
     * @param object - the variable being tested
     */
    isNotBlank: isNotBlank,
    /**
     * f(x) = x
     * @param arg
     * @returns {*}
     */
    identity: function(arg) {
        return arg;
    },
    makeRangeSorter: function(fieldMin, fieldMax) {
        return function sorter(a,b) {
            var minA = num(a[fieldMin]);
            var maxA = num(a[fieldMax]);
            var minB = num(b[fieldMin]);
            var maxB = num(b[fieldMax]);
            var diff = (minA - minB);
            return (diff !== 0) ? diff : (maxA - maxB);
        }  
    },
    /**
     * Create a sort function that sorts an array of items by a specific field name
     * (must be a string, will be sorted ignoring case).Sort items by a property of each object (must be a string)
     * @param listener
     */
    makeFieldSorter: function(fieldName) {
        return function sorter(a,b) {
            return a[fieldName].toLowerCase().localeCompare(b[fieldName].toLowerCase());
        };
    },
    /**
     * Combine sort functions for multi-field sorting. Takes one or more sort functions (as would be 
     * passed to an array's sort method).
     */
    multiFieldSorter: function() {
        var sortFuncs = Array.prototype.slice.call(arguments);
        return function sorter(a,b) {
            for (var i=0; i < sortFuncs.length; i++) {
                var sorter = sortFuncs[i];
                var output = sorter(a,b);
                if (output != 0) {
                    return output;
                }
            }
            return 0;
        }
    },
    /**
     * A start handler called before a request to the server is made. All errors are cleared
     * and a loading indicator is shown. This is not done globally because some server requests
     * happen in the background and don't signal to the user that they are occurring.
     * @param vm
     * @param event
     */
    startHandler: function(vm, event) {
        displayPendingControl(event.target);
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
            clearPendingControl();
            ko.postbox.publish("clearErrors");
            if (message) {
                toastr.success(message);
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
            clearPendingControl();
            ko.postbox.publish("clearErrors");
            if (response.status === 412) {
                toastr.error('You do not appear to be a developer, researcher, or admin.');
            } else if (response instanceof Error) {
                toastr.error(response.message);
            } else if (response.responseJSON) {
                var payload = response.responseJSON;
                ko.postbox.publish("showErrors", payload);
                console.log(payload);
            } else {
                toastr.error(GENERIC_ERROR);
            }
        };
    },
    errorHandler: console.error.bind(console),
    /**
     * Create an observable for each field name provided. Will create an observableArray if the notation indicates
     * such (e.g. "entries[]" rather than "entries").
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

            object[insp.name] = null;
            var obs = vm[insp.observerName];
            if (isDefined(obs)) {
                object[insp.name] = obs();
            }
        }
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
            date = date.replace('T00:00:00.000Z','');
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
    },
    formatVersionRange: function(minValue, maxValue) {
        if (isDefined(minValue) && isDefined(maxValue)) {
            return minValue + "-" + maxValue;
        } else if (isDefined(minValue)) {
            return minValue + "+";
        } else if (isDefined(maxValue)) {
            return "0-" + maxValue;
        }
        return "<i>All versions</i>";
    },
    /**
     * label --> Label (only one word however)
     */
    formatTitleCase: formatTitleCase,
    /**
     * Format user name, removing our <EMPTY> string to work around Stormpath requirements.
     */
    formatName: function(person) {
        var array = [];
        notBlankName(array, person.firstName);
        notBlankName(array, person.lastName);
        return (array.length === 0) ? '—' : array.join(' ');
    },
    /**
     * snake_case_label --> Snake Case Label 
     */
    snakeToTitleCase: function(string, defaultValue) {
        if (string) {
            return formatTitleCase(string.replace(/_/g, ' '));
        }
        return defaultValue;
    },
    /**
     * Create a function that will remove items from a history table once we confirm they
     * are deleted. If we've deleted everything, go to the root view for this type of item.
     * This method assumes that the viewModel holds the row model in an "itemsObs" observable.
     *
     * @param vm
     *  a viewModel with an "itemObs" observable array of the model objects in the table
     * @param deletables
     *  an array of model objects to delete (associated to the rows of the table)
     * @param rootPath
     *  if all items are deleted, redirect to this view.
     * @returns {Function}
     *  a function to assign to the success handler of a promise
     */
    makeTableRowHandler: function(vm, deletables, rootPath) {
        return function() {
            deletables.forEach(function(deletable) {
                vm.itemsObs.remove(deletable);
            });
            if (vm.itemsObs().length === 0) {
                // Yes both. There are cases where 'rootPath' is just the current page.
                document.querySelector(".loading_status").textContent = "There are currently no items.";
                document.location = rootPath;
            }
        };
    },
    addCheckedObs: function(item) {
        item.checkedObs = ko.observable(false);
        return item;
    },
    hasBeenChecked: function(item) {
        return item.checkedObs();
    },
    /**
     * Generic handler for pages which are loading a particular entity, that attemp to
     * deal with 404s by redirecting to a parent page.
     * @param vm
     * @param message
     * @param rootPath
     * @returns {Function}
     */
    notFoundHandler: function(vm, message, rootPath) {
        return function(response) {
            console.error(response);
            toastr.error((message) ? message : response.statusText);
            if (rootPath) {
                document.location = rootPath;
            }
        };
    },
    /**
     * Given an array of option objects (with the properties "label" and "value"),
     * return a function that will return a specific option given a value.
     * @param options array or observableArray
     * @returns {Function}
     */
    makeOptionFinder: makeOptionFinder,
    /**
     * Given an array of option objects (with the properties "label" and "value"),
     * return a function that will return an option label given a value.
     * @param options array or observableArray
     * @returns {Function}
     */
    makeOptionLabelFinder: makeOptionLabelFinder,
    /**
     * Walk object and remove any properties that are set to null or an empty string.
     */
    deleteUnusedProperties: deleteUnusedProperties,
    /**
     * The panel editors are sibling views to the main view, so they convert user
     * UI events into postbox events on the main collection being edited. This is
     * a convenience method to generate those.
     * @param eventName
     * @returns {Function}
     */
    makeEventToPostboxListener: function(eventName) {
        return function(vm, event) {
            event.preventDefault();
            event.stopPropagation();
            ko.postbox.publish(eventName, vm);
        };
    },
    /**
     * The logic for the scrollbox scrolling is not idea so isolate it here where we
     * can fix it everywhere it is used.
     * @param itemSelector
     * @returns {scrollTo}
     */
    makeScrollTo: function(itemSelector) {
        return function scrollTo(index) {
            var offset = $(".fixed-header").outerHeight() * 1.75;
            var $scrollbox = $(".scrollbox");
            var $element = $scrollbox.find(itemSelector).eq(index);
            if ($scrollbox.length && $element.length) {
                $scrollbox.scrollTo($element, {offsetTop: offset});
                setTimeout(function() {
                    $element.find(".focus").focus().click();
                },20);
            }
        };
    },
    fadeUp: function() {
        return function(div) {
            if (div.nodeType === 1) {
                var $div = $(div);
                $div.slideUp(function() { $div.remove(); });
            }
        };
    },
    animatedDeleter: function(scrollTo, elementsObs) {
        return function(element) {
            if (confirm("Are you sure?")) {
                var index = elementsObs.indexOf(element);
                elementsObs.remove(element);
                setTimeout(function() {
                    scrollTo(index);
                }, 510);
            }
        };
    }
};
