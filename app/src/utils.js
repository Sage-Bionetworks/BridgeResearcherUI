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
function mightyMessageFinder(response) {
    if (response.responseJSON && response.responseJSON.message) {
        return response.responseJSON.message;
    } if (response.responseJSON) {
        return JSON.stringify(response.responseJSON);
    } else if (response.message) {
        return response.message;
    } else if (typeof response === "string") {
        return response;
    }
    return JSON.stringify(response);
}
function createEmailTemplate(email, identifier) {
    var parts = email.split("@");
    if (parts[0].indexOf("+") > -1) {
        parts[0] = parts[0].split("+")[0];
    }
    return parts[0] + "+" + identifier + "@" + parts[1];
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
        };
    },
    /**
     * Create a sort function that sorts an array of items by a specific field name
     * (must be a string, will be sorted ignoring case).Sort items by a property of each object (must be a string)
     * @param listener
     */
    makeFieldSorter: function(fieldName) {
        return function sorter(a,b) {
            return a[fieldName].localeCompare(b[fieldName]);
        };
    },
    lowerCaseStringSorter: function sorter(a,b) {
        return a.localeCompare(b);
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
                if (output !== 0) {
                    return output;
                }
            }
            return 0;
        };
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
     * @returns {Function}
     */
    failureHandler: function() {
        return function(response) {
            console.error("failureHandler", response);
            clearPendingControl();
            ko.postbox.publish("clearErrors");
            if (response.status === 412) {
                toastr.error('You do not appear to be a developer, researcher, or admin.');
            } else if (response.responseJSON) {
                var payload = response.responseJSON;
                ko.postbox.publish("showErrors", payload);
            } else if (response instanceof Error) {
                toastr.error(response.message);
            } else {
                toastr.error(GENERIC_ERROR);
            }
        };
    },
    /**
     * Some APIs return an error with a simple message, but we want to display this as 
     * if it were a global message for a form validation view (sign in, for example). This 
     * failure handler converts the signature of the response and cleans up just as the 
     * failure handler does.
     * 
     * @param actionElement - the DOM element that is currently showing a request is pendingControl.
     *  This is necessary for forms where a submit action has triggered the request.
     */
    globalToFormFailureHandler: function(actionElement) {
        return function(response) {
            console.error("globalToFormFailureHandler", response);
            ko.postbox.publish("clearErrors");
            var msg = mightyMessageFinder(response);
            if (response.status === 412) {
                msg = "You do not appear to be a developer, researcher, or admin.";
            }
            if (actionElement) {
                actionElement.classList.remove("loading");
            }
            ko.postbox.publish("showErrors", {message:msg,errors:{}});
        };
    },
    // TODO: Get rid of the need to have a reference to the dom element that has a spinner,
    // using a binding.
    formFailure: function(actionElement, message) {
        ko.postbox.publish("clearErrors");
        if (actionElement) {
            actionElement.classList.remove("loading");
        }
        ko.postbox.publish("showErrors", {message:message,errors:{}});
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
    formatISODate: function(date) {
        date = date || new Date();
        return date.toISOString().split("T")[0];  
    },
    formatVersionRange: function(minValue, maxValue) {
        if (isNotBlank(minValue) && isNotBlank(maxValue)) {
            return minValue + "-" + maxValue;
        } else if (isNotBlank(minValue)) {
            return minValue + "+";
        } else if (isNotBlank(maxValue)) {
            return "0-" + maxValue;
        }
        return "<i>All versions</i>";
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
     * Generic handler for pages which are loading a particular entity. If the error that is returned 
     * is a 404 it attempts to deal with it by redirecting to a parent page.
     * @param vm
     * @param message
     * @param rootPath
     * @returns {Function}
     */
    notFoundHandler: function(vm, message, rootPath) {
        return function(response) {
            if (rootPath && response.status === 404) {
                toastr.error((message) ? message : response.statusText);
                document.location = rootPath;
            } else {
                toastr.error(response.statusText || response.message);
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
        return function(model, event) {
            event.preventDefault();
            event.stopPropagation();
            ko.postbox.publish(eventName, model);
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
    },
    atLeastOneSignedConsent: function(consentHistories) {
        if (Object.keys(consentHistories).length === 0) {
            return true;
        }
        // At least one consent history whose last item has not been withdrawn.
        return Object.keys(consentHistories).some(function(guid) {
            var history = consentHistories[guid];
            if (history.length === 0) {
                return true;
            }
            var last = history[history.length-1];
            return (last && typeof last.withdrewOn === "undefined");
        });
    },
    createParticipantForID: function(email, identifier) {
        return {
            "email": createEmailTemplate(email, identifier),
            "password": identifier,
            "externalId": identifier,
            "sharingScope": "all_qualified_researchers"
        };
    },
    mightyMessageFinder: mightyMessageFinder
};
