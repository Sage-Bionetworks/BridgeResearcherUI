var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

var fields = ["message", "minAgeOfConsent"];

module.exports = function() {
    var self = this;

    self.study = null;
    utils.observablesFor(self, fields);

    self.minAge = ko.computed(function(){
        return (self.minAgeOfConsentObs() == 121) ? "No age limit" : self.minAgeOfConsentObs();
    });

    self.save = function(vm, event) {
        utils.startHandler(vm, event);
        utils.observablesToObject(self, self.study, fields);

        if (self.study.minAgeOfConsent == 121) {
            self.study.minAgeOfConsent = 0;
        }
        serverService.saveStudy(self.study)
            .then(function(response) {
                self.study.version = response.version;
            })
            .then(utils.successHandler(self, event, "Study updated."))
            .catch(utils.failureHandler(self, event));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        if (self.study.minAgeOfConsent == 0) {
            self.study.minAgeOfConsent = 121;
        }
        utils.valuesToObservables(self, study, fields);
    });
};