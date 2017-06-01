var ko = require('knockout');
require('knockout-postbox');
var toastr = require('toastr');
var config = require('./config');
var $ = require('jquery');
var alerts = require('./widgets/alerts');

var FAILURE_HANDLER = failureHandler({transient:true});
var GENERIC_ERROR = "A server error happened. We don't know what exactly. Please try again.";
var TIMEOUT_ERROR = "The request timed out. Please verify you have an internet connection, and try again.";
var ROLE_ERROR = 'You do not appear to be a developer, researcher, or admin.';
var pendingControl = null;
toastr.options = config.toastr;

var statusHandlers = {
    400: badResponseHandler,
    409: badResponseHandler,
    0: function(response) {
        var error = (response.statusText === "timeout") ? TIMEOUT_ERROR : GENERIC_ERROR;
        toastr.error(error);
    },
    404: function(response, params) {
        if (params.redirectTo) {
            var root = require('./root'); // insane, but has to happen here.
            document.location = "#/" + params.redirectTo;
            root.changeView(params.redirectTo);
            if (params.redirectMsg) {
                setTimeout(function() {
                    toastr.warning(params.redirectMsg);
                },500);
            }
        } else {
            badResponseHandler(response, params);
        }
    },
    412: function(response) {
        toastr.error(ROLE_ERROR);
    },
    500: function(response) {
        toastr.error(JSON.stringify(response.responseJSON));
    }
};
function badResponseHandler(response, params) {
    var payload = response.responseJSON;
    if (!params.transient && !payload.errors) {
        payload.errors = {};
    }
    ko.postbox.publish("showErrors", payload);
}
function errorMessageHandler(message, params) {
    if (params.transient) {
        toastr.error(message);
    } else {
        var payload = {"message":message};
        ko.postbox.publish("showErrors", payload);
    }
}
function statusNotHandled(res) {
    console.error("Response code not handled", res.status);
}
/**
 * params:
 *  transient: boolean, default: true
 *  redirectTo: string, default null
 *  redirectMsg: message
 *  scrollTo: scrollTo function to execute.
 */
function failureHandler(params) {
    if (arguments.length === 0) {
        return FAILURE_HANDLER;
    }
    if (typeof params.transient !== "boolean") {
        params.transient = true;
    }
    return function(response) {
        clearPendingControl();
        ko.postbox.publish("clearErrors");

        if (typeof response === "string") {
            errorMessageHandler(response, params);
        } else if (is(response.status,'Number')) {
            var handler = statusHandlers[ response.status ] || statusNotHandled;
            handler(response, params);
        } else if (response.message) {
            errorMessageHandler(response.message, params);
        } else {
            console.error("Response object shape not handled", response);
        }
        if (params.scrollTo) {
            scrollTo(1);
        }
    };
}
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
function createEmailTemplate(email, identifier) {
    var parts = email.split("@");
    if (parts[0].indexOf("+") > -1) {
        parts[0] = parts[0].split("+")[0];
    }
    return parts[0] + "+" + identifier + "@" + parts[1];
}
function atLeastOneSignedConsent(consentHistories) {
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
}
function clipString(value) {
    var p = document.createElement("textarea");
    p.style = "position:fixed;top:0;left:0";
    p.value = value;
    document.body.appendChild(p);
    p.select();
    if (document.execCommand && document.execCommand('copy')) {
        toastr.success("Copied: " + value);
    } else {
        toastr.error("Could not copy value.");        
    }
    document.body.removeChild(p);
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
    findStudyName: function (studies, studyIdentifier) {
        try {
            return (studies || []).filter(function(studyOption) {
                return (studyOption.identifier === studyIdentifier);
            })[0].name;
        } catch(e) {
            throw new Error("Study '"+studyIdentifier+"' not found.");
        }
    },
    atLeastOneSignedConsent: atLeastOneSignedConsent,
    clipString: clipString,
    failureHandler: failureHandler
};
