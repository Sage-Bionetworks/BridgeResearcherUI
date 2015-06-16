var ko = require('knockout');
var serverService = require('../../services/server_service');

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

    self.records = ko.observableArray();
    self.errorMsg = ko.observable("");
    self.errorFields = ko.observableArray();

    serverService.getStudy().then(function(study) {
        self.records.push(study);
    });

    self.save = function(study, event) {
        event.preventDefault();
        serverService.saveStudy(study).then(function(response) {
            self.records()[0].version = response.version;
        }).catch(function(response) {
            if (response.responseJSON) {
                self.errorMsg(response.responseJSON.message);
                self.errorFields.removeAll();
                self.errorFields.pushAll(Object.keys(response.responseJSON.errors));
            } else {
                alert("There has been an error on the server");
            }
        });
    };
};
