var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');

var fields = ['message', 'name', 'sponsorName', 'technicalEmail', 'supportEmail', 'consentNotificationEmail', 'identifier'];

module.exports = function() {
    var self = this;

    utils.observablesFor(self, fields);
    self.emailStatusObs = ko.observable('');

    function updateEmailStatus() {
        serverService.emailStatus().then(function(response) {
            console.log("serverService.emailStatus()", response);
            self.emailStatusObs(response.status);
        });
    }

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        utils.observablesToObject(self, self.study, fields);

        serverService.saveStudy(self.study)
                .then(function(response) {
                    self.study.version = response.version;
                })
                .then(utils.successHandler(vm, event, "Study information saved."))
                .then(updateEmailStatus)
                .catch(utils.failureHandler(vm, event));
    };
    self.publicKey = function() {
        if (self.study) {
            // It finds this and it works...
            root.openDialog('publickey', {study: self.study});
        }
    };
    self.verifyEmail = function() {
        serverService.verifyEmail().then(function(response) {
            console.log("serverService.verifyEmail()", response);
            self.emailStatusObs(response.status);
        });
    };
    self.refreshStatus = updateEmailStatus;

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
        updateEmailStatus();
    });
};
