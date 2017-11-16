import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import root from '../../root';
import serverService from '../../services/server_service';
import utils from '../../utils';

module.exports = function(params) {
    var self = this;

    self.cancel = root.closeDialog;

    new Binder(self)
        .obs('subject', '')
        .obs('message', '');

    function sendNotification(msgObj) {
        if (params.userId) {
            return serverService.sendUserNotification(params.userId, msgObj);
        } else if (params.topicId) {
            return serverService.sendTopicNotification(params.topicId, msgObj);
        }
    }

    self.send = function(vm, event) {
        var msgObj = {
            subject: self.subjectObs(), 
            message: self.messageObs()
        };
        var error = new BridgeError();
        if (msgObj.subject === "") {
            error.addError("subject", "is required");
        }
        if (msgObj.message === "") {
            error.addError("message", "is required");
        }
        if (error.hasErrors()) {
            return utils.failureHandler({transient:false})(error);
        }

        utils.startHandler(vm, event);
        sendNotification(msgObj)
            .then(utils.successHandler(vm, event, "Notification has been sent."))
            .then(self.cancel)
            .catch(utils.failureHandler({transient:false}));
    };
};
