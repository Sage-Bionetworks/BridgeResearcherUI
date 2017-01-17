var ko = require('knockout');
var serverService = require('../../services/server_service');
var root = require('../../root');
var bind = require('../../binder');
var utils = require('../../utils');

module.exports = function(params) {
    var self = this;

    bind(self)
        .bind('subject', '')
        .bind('message', '');

    self.send = function(vm, event) {
        if (self.subjectObs() === "" || self.messageObs() === "") {
            utils.formFailure(event.target, 'Subject and message are both required.');
            return;
        }
        var subject = self.subjectObs();
        var message = self.messageObs();
        utils.startHandler(vm, event);
        serverService.sendNotification(params.userId, {
            subject: subject, message: message
        })
        .then(utils.successHandler(vm, event, "Notification has been sent."))
        .then(self.cancel)
        .catch(utils.dialogFailureHandler(vm, event));        
    };
    self.cancel = function(vm, event) {
        root.closeDialog();
    };
};
