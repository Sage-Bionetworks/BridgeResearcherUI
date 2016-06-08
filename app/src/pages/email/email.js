var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');

module.exports = function() {
    var self = this;

    var binder = bind(self)
        .obs('status','')
        .obs('message')
        .obs('name')
        .obs('sponsorName')
        .obs('identifier')
        .bind('technicalEmail')
        .bind('supportEmail')
        .bind('consentNotificationEmail');

    function checkEmailStatus() {
        return serverService.emailStatus().then(binder.update('status'));
    }
    
    self.save = function(vm, event) {
        self.study = binder.persist(self.study);

        utils.startHandler(vm, event);
        serverService.saveStudy(self.study)
            .then(checkEmailStatus)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler(vm, event));
    };
    self.verifyEmail = function(vm, event) {
        utils.startHandler(vm, event);
        serverService.verifyEmail()
            .then(updateEmailStatus)
            .then(utils.successHandler(vm, event, "Request to verify email has been sent."))
            .catch(utils.failureHandler(vm, event));
    };
    self.refreshStatus = checkEmailStatus;

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .then(checkEmailStatus)
        .catch(function(){});
};
