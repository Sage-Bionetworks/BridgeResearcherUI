var ko = require('knockout');
require('knockout-postbox');
var toastr = require('toastr');
var $ = require('jquery');

var ENUM_ERROR = ["Enumeration values can only contain alphanumeric characters (they can also have spaces, dashes, underscores and periods in the middle, but not more than one of these special characters in a row)."];

function truncateErrorFieldKey(errorString) {
    var parts = errorString.split(" ");
    var keyParts = parts[0].split(".");
    parts[0] = keyParts[keyParts.length-1];
    return parts.join(" ")
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        .replace(/(\[[0-9+]\])/g, '')
        .replace("Versions{Android}","version") // schema IEE strangeness
        .replace("Versions{i Phone OS}", "version") // schema IEE strangeness
        .toLowerCase();
}

/**
 * The survey editor creates detailed error messages for enumeration values that we can't display in the
 * editor. Collapse and simplify these messages so we can point to the right questions.
 */
function fixEnumErrorsForTopLevelEditor(errors) {
    var adjErrorFields = [];
    for (var prop in errors) {
        if (prop.indexOf(".enumeration[") > -1) {
            var adjProp = prop.split(".enumeration[")[0] + ".enumeration";
            adjErrorFields.push(adjProp);
            delete errors[prop];
        }
    }
    // Duplicates are eliminated in this copy back using field names as prop names.
    adjErrorFields.forEach(function(newProp) {
        errors[newProp] = ENUM_ERROR;
    });
}

function errorFieldKeyToId(errorKey) {
    return errorKey.replace(/[\s{\[\]]/g,"").replace(/\./g,"_").replace(/}/g,'');
}

var errorComponentStack = [];

function isNotSelf(self) {
    return errorComponentStack[errorComponentStack.length-1] !== self;
}

module.exports = function() {
    errorComponentStack.push(this);
    console.log("creating errors component", errorComponentStack);
    var self = this;

    var errorQueue = [];
    var errorLabelQueue = [];

    self.errorsObs = ko.observableArray([]);
    self.displayObs = ko.computed(function() {
        return self.errorsObs().length > 0;
    });
    
    ko.postbox.subscribe("showErrors", function(payload) {
        if (isNotSelf(self)) {
            return;
        }
        if (payload.message && typeof payload.errors === "undefined") {
            toastr.error(payload.message);
            return;
        }
        var message = payload.message;
        var errors = payload.errors;
        fixEnumErrorsForTopLevelEditor(errors);

        // Scroll to top of scrollbox. jQuery is included globally in the page
        $(".scrollbox").scrollTo(0);

        var globalErrors = [];
        // This was basically a payload with a message and no errors... so show the message.
        if (Object.keys(payload.errors).length === 0) {
            globalErrors.push(message);
        }
        for (var fieldName in errors) {
            var string = errors[fieldName].map(truncateErrorFieldKey).join("; ");

            // This now attempts to find a class token because the range controls have one field
            // border and two controls, both of which can have server errors. Were I to redo this, 
            // I might be inclined to switch over entirely to class tokens rather than IDs to 
            // simplify this, but it introduces new difficulties.
            var id = errorFieldKeyToId(fieldName);
            var fieldEl = document.getElementById(id);
            if (!fieldEl) {
                fieldEl = document.querySelector("."+id);
            }
            if (fieldEl) {
                var div = fieldEl.querySelector(".ui.basic.red.pointing.prompt");
                if (!div) {
                    div = document.createElement("div");
                    div.className = "ui basic red pointing prompt label transition visible";
                    errorLabelQueue.push(div);
                    fieldEl.appendChild(div);
                }
                div.innerHTML = string;
                fieldEl.classList.add("error");
                errorQueue.push(fieldEl);
            } else {
                globalErrors.push(string);
            }
        }
        if (globalErrors.length === 0) {
            globalErrors.push("Please see the errors in red below");
        }
        self.errorsObs.pushAll(globalErrors);
    });
    ko.postbox.subscribe("clearErrors", function() {
        if (isNotSelf(self)) {
            return;
        }
        self.errorsObs.removeAll();
        toastr.clear();
        errorQueue.forEach(function(field) {
            field.classList.remove("error");
        });
        errorLabelQueue.forEach(function(element) {
            element.parentNode.removeChild(element);
        });
        errorQueue = [];
        errorLabelQueue = [];
    });
};
module.exports.prototype.dispose = function() {
    errorComponentStack.pop(this);
    this.displayObs.dispose();
    console.log("disposing errors component", errorComponentStack);
};