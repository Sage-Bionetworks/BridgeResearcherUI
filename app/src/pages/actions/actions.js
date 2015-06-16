var ko = require('knockout');
var serverService = require('../../services/server_service');

// Would like to create a utility library of these.
function jsonMessageHandler(observable, button) {
    return function(response) {
        if (button) {
            button.classList.remove("loading");
        }
        if (response.responseJSON && response.responseJSON.message) {
            observable(response.responseJSON.message);
        } else if (response.message) {
            observable(response.message);
        } else {
            observable(response.toString());
        }
    }
}

module.exports = function() {
    var self = this;

    self.message = ko.observable("");
    self.errorMsg = ko.observable("");

    self.sendRoster = function(vm, event) {
        event.target.classList.add("loading");
        serverService.sendRoster()
            .then(jsonMessageHandler(self.message, event.target))
            .catch(jsonMessageHandler(self.errorMsg, event.target));
    };
};