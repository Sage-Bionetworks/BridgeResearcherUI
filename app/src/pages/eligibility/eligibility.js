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

function validValue(value) {
    return (value === "") || (/^\d+$/.test(value) && value >= 0);
}

module.exports = function() {
    var self = this;

    self.study = null;
    self.message = ko.observable("");
    self.errorMsg = ko.observable("");
    self.errorFields = ko.observableArray();
    self.minAgeOfConsent = ko.observable(0);
    self.maxNumOfParticipants = ko.observable(0);

    self.save = function(vm, event) {
        self.message("");
        self.errorMsg("");
        self.errorFields.removeAll();

        var minAge = self.minAgeOfConsent();
        var maxNum = self.maxNumOfParticipants();
        if (!validValue(minAge)) {
            self.errorFields.push("minAge");
            self.errorMsg("Please enter values of zero or greater.");
        }
        if (!validValue(maxNum)) {
            self.errorFields.push("maxNum");
            self.errorMsg("Please enter values of zero or greater.");
        }
        if (self.errorFields().length === 0) {
            event.target.classList.add("loading");
            self.study.minAgeOfConsent = minAge;
            self.study.maxNumOfParticipants = maxNum;
            serverService.saveStudy(self.study)
                .then(function(versionHolder) {
                    event.target.classList.remove("loading");
                    self.study.version = versionHolder.version;
                    self.message("Study updated.");
                })
                .catch(jsonMessageHandler(self.errorMsg, event.target));
        }
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        self.minAgeOfConsent(study.minAgeOfConsent);
        self.maxNumOfParticipants(study.maxNumOfParticipants);
    });
};