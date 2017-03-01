var ko = require('knockout');
require('knockout-postbox');
var toastr = require('toastr');
var config = require('./config');
var $ = require('jquery');
var alerts = require('./widgets/alerts');

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
// This creates a date range in the user's local (browser) timezone.
function getDateRange(date) {
    date = (date) ? new Date(date) : new Date();
    return {
        startTime: formatLocalDate(date, "00:00:00.000"), 
        endTime: formatLocalDate(date, "23:59:59.999")
    };
}
function formatLocalDate(now, timePortion) {
    var tzo = -now.getTimezoneOffset(), dif = tzo >= 0 ? '+' : '-';

    return now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate()) +
        'T' + timePortion + dif + pad(tzo / 60) + ':' + pad(tzo % 60);
}
function pad(num) {
    var norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
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
        if (event && event.target) {
            displayPendingControl(event.target);
        }
        ko.postbox.publish("clearErrors");
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
    listFailureHandler: function(itemsObs) {
        return function(response) {
            console.error("listFailureHandler", response);
            clearPendingControl();
            ko.postbox.publish("clearErrors");
            if (response.status === 412) {
                toastr.error('You do not appear to be a developer, researcher, or admin.');
            } else if (response.responseJSON) {
                toastr.error(response.responseJSON.message);
            }
            if (itemsObs) {
                itemsObs([]);
            }
        };
    },
    /**
     * Some APIs return an error with a simple message, but we want to display this as 
     * if it were a global message for a form validation view (sign in, for example). This 
     * failure handler converts the signature of the response and cleans up just as the 
     * failure handler does.
     */
    dialogFailureHandler: function(vm, event) {
        return function(response) {
            console.error("dialogFailureHandler", response);
            ko.postbox.publish("clearErrors");
            var msg = mightyMessageFinder(response);
            if (response.status === 412) {
                msg = "You do not appear to be a developer, researcher, or admin.";
            }
            event.target.classList.remove("loading");
            if (response.responseJSON && response.responseJSON.errors) {
                ko.postbox.publish("showErrors", response.responseJSON);
            } else {
                ko.postbox.publish("showErrors", {message:msg,errors:{}});
            }
        };
    },
    clearPendingControl: clearPendingControl,
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
     * Generic handler for pages which are loading a particular entity. If the error that is returned 
     * is a 404 it attempts to deal with it by redirecting to a parent page.
     * @param message
     * @param componentName
     * @returns {Function}
     */
    notFoundHandler: function(message, componentName) {
        return function(response) {
            if (componentName && response.status === 404) {
                // Again we can't load this earlier for some reason
                var root = require('./root');
                toastr.error((message) ? message + " not found." : response.statusText);
                document.location = "#/" + componentName;
                root.changeView(componentName);
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
    // TODO: There is also the binding fadeRemove, ostensibly to do the same thing.
    animatedDeleter: function(scrollTo, elementsObs, selectedElementObs) {
        return function(element, event) {
            event.stopPropagation();
            alerts.deleteConfirmation("Are you sure you want to delete this?", function() {
                setTimeout(function() {
                    var index = elementsObs.indexOf(element);
                    elementsObs.splice(index,1);
                    setTimeout(function() {
                        if (selectedElementObs) {
                            selectedElementObs(index);
                        } else {
                            scrollTo(index);
                        }
                    }, 300);
                }, 500);
            });
        };
    },    
    mightyMessageFinder: mightyMessageFinder,
    findStudyName: function (studies, studyIdentifier) {
        try {
            return (studies || []).filter(function(studyOption) {
                return (studyOption.identifier === studyIdentifier);
            })[0].name;
        } catch(e) {
            throw new Error("Study '"+studyIdentifier+"' not found.");
        }
    },
    getDateRange: getDateRange
};
