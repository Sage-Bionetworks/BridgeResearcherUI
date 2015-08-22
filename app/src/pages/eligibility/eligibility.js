var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

var fields = ["minAgeOfConsent"];

module.exports = function() {
    var self = this;

    self.study = null;
    self.messageObs = ko.observable("");
    self.errorFields = ko.observableArray();
    utils.observablesFor(self, fields);

    self.minAge = ko.computed(function(){
        return (self.minAgeOfConsentObs() === 0) ? "No age limit" : self.minAgeOfConsentObs();
    });

    self.errorFor = function(fieldName) {
        return ko.computed(function() {
            return (self.errorFields.indexOf(fieldName) > -1) ? "error" : "";
        });
    };

    self.save = function(vm, event) {
        utils.startHandler(vm, event);
        utils.observablesToObject(self, self.study, fields);

        serverService.saveStudy(self.study)
            .then(utils.successHandler(self, event))
            .then(function(response) {
                self.study.version = response.version;
                self.messageObs({text:"Study updated."});
            })
            .catch(utils.failureHandler(self, event));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
    });
};