var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

var fields = ['name', 'sponsorName', 'technicalEmail', 'supportEmail', 'consentNotificationEmail', 'identifier'];

module.exports = function() {
    var self = this;

    utils.observablesFor(self, fields);
    self.message = ko.observable("");
    self.errorFields = ko.observableArray();

    self.errorFor = function(fieldName) {
        return ko.computed(function() {
            return (self.errorFields.indexOf(fieldName) > -1) ? "error" : "";
        });
    };

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        utils.observablesToObject(self, self.study, fields);

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                self.study.version = response.version;
                self.message({text: "Study information saved."});
            }).catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
    });
};
