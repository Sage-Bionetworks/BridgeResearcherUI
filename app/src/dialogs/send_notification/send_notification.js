var serverService = require('../../services/server_service');
var root = require('../../root');
var bind = require('../../binder');
var utils = require('../../utils');

module.exports = function(params) {
    var self = this;

    self.cancel = root.closeDialog;

    bind(self)
        .bind('subject', '')
        .bind('message', '');

    function sendNotification(msgObj) {
        if (params.userId) {
            return serverService.sendUserNotification(params.userId, msgObj);
        } else if (params.topicId) {
            return serverService.sendTopicNotification(params.topicId, msgObj);
        }
    }

    self.send = function(vm, event) {
        var subject = self.subjectObs();
        var message = self.messageObs();
        if (subject === "" || message === "") {
            utils.formFailure(event.target, 'Subject and message are both required.');
            return;
        }
        var msgObj = {subject: subject, message: message};

        utils.startHandler(vm, event);
        var promise = sendNotification(msgObj)
            .then(utils.successHandler(vm, event, "Notification has been sent."))
            .then(self.cancel)
            .catch(utils.dialogFailureHandler(vm, event));        
    };
};
