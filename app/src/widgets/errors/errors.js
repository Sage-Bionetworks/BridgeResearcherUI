var ko = require('knockout');
require('knockout-postbox');
var toastr = require('toastr');
var $ = require('jquery');

function truncateErrorFieldKey(errorString) {
    var parts = errorString.split(" ");
    var keyParts = parts[0].split(".");
    parts[0] = keyParts[keyParts.length-1];
    return parts.join(" ").replace(/([a-z\d])([A-Z])/g, '$1 $2').toLowerCase();
}

function errorFieldKeyToId(errorKey) {
    return errorKey.replace(/[\[\]]/g,"").replace(/\./g,"_");
}

module.exports = function() {
    var self = this;

    var errorQueue = [];
    var errorLabelQueue = [];

    self.errorsObs = ko.observableArray([]);
    self.displayObs = ko.computed(function() {
        return self.errorsObs().length > 0;
    });
    
    ko.postbox.subscribe("showErrors", function(payload) {
        if (payload.message && typeof payload.errors === "undefined") {
            toastr.error(payload.message);
            return;
        }
        console.log("payload",payload);
        var message = payload.message;
        var errors = payload.errors;

        // Scroll to top of scrollbox. jQuery is included globally in the page
        $(".scrollbox").scrollTo(0);

        var globalErrors = [];
        // This was basically a payload with a message and no errors... so show the message.
        if (Object.keys(payload.errors).length === 0) {
            globalErrors.push(message);
        }
        for (var fieldName in errors) {
            var string = errors[fieldName].map(truncateErrorFieldKey).join("; ");

            var id = errorFieldKeyToId(fieldName);
            var fieldEl = document.getElementById(id);
            if (fieldEl) {
                var div = document.createElement("div");
                div.className = "ui basic red pointing prompt label transition visible";
                div.innerHTML = string;
                errorLabelQueue.push(div);

                fieldEl.classList.add("error");
                fieldEl.appendChild(div);
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