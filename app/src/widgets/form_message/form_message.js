var $ = require('jquery');
var ko = require('knockout');

module.exports = function(params) {
    var self = this;

    self.cssClass = ko.observable("green");
    self.internalMessage = ko.observable("");

    // Subscribe to receive messages from parent MV.
    params.message.subscribe(function(newValue) {
        console.log(newValue)
        if (typeof newValue === "string") {
            self.internalMessage("");
            self.cssClass("green");
            $(".form").removeClass("error");
            return;
        } else if (typeof newValue.text === "string") {
            newValue.status = newValue.status || "green";
            self.internalMessage(newValue.text);
            self.cssClass(newValue.status);
        } else {
            self.internalMessage("Some pretty boring error happened. We don't know what exactly. Please try again.");
            self.cssClass("error");
            console.error(arguments);
        }

        if (self.cssClass() === "error") {
            $(".form").addClass("error");
        } else {
            $(".form").removeClass("error");
        }
    });

    self.hasMessage = ko.computed(function() {
        return self.internalMessage().length > 0;
    });
};

