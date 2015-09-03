var $ = require('jquery');
var ko = require('knockout');

var GENERIC_ERROR = "A server error happened. We don't know what exactly. Please try again.";

module.exports = function(params) {
    var self = this;

    self.cssClass = ko.observable("green");
    self.internalMessage = ko.observable("");

    function displayMessage(css, message) {
        self.cssClass(css);
        self.internalMessage(message);
    }

    // Subscribe to receive messages from parent MV.
    params.messageObs.subscribe(function(newValue) {
        if (typeof newValue === "string") {
            displayMessage("green", newValue);
        } else if (typeof newValue.text === "string") {
            displayMessage(newValue.status || "green", newValue.text);
        } else {
            displayMessage("error", GENERIC_ERROR);
        }
    });

    self.hasMessage = ko.computed(function() {
        return self.internalMessage().length > 0;
    });
};

