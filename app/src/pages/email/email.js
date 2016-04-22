var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');

var fields = ['message', 'name', 'sponsorName', 'technicalEmail', 
    'supportEmail', 'consentNotificationEmail', 'identifier'];

module.exports = function() {
    var self = this;

    utils.observablesFor(self, fields);
    self.emailStatusObs = ko.observable('');

    function checkEmailStatus() {
        serverService.emailStatus().then(updateEmailStatus);
    }
    function updateEmailStatus(response) {
        self.emailStatusObs(response.status);
        return response;        
    }
    function updateStudyVersion(response) {
        self.study.version = response.version;
        return response;
    }

    self.save = function(vm, event) {
        utils.observablesToObject(self, self.study, fields);
        
        utils.startHandler(vm, event);
        serverService.saveStudy(self.study)
            .then(updateStudyVersion)
            .then(checkEmailStatus)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler(vm, event));
    };
    self.publicKey = function() {
        if (self.study) {
            root.openDialog('publickey', {study: self.study});
        }
    };
    self.verifyEmail = function(vm, event) {
        utils.startHandler(vm, event);
        serverService.verifyEmail().then(updateEmailStatus)
            .then(utils.successHandler(vm, event, "Request to verify email has been sent."))
            .catch(utils.failureHandler(vm, event));
    };
    self.refreshStatus = checkEmailStatus;

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
        checkEmailStatus();
    });
};
