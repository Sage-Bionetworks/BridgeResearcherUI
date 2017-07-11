import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import serverService from '../../services/server_service';
import utils from '../../utils';

module.exports = function(params) {
    var self = this;

    var binder = new Binder(self)
        .obs('showIdentifier', typeof params.identifier === "undefined")
        .obs('userId', params.userId)
        .bind('identifier', params.identifier)
        .bind('date', params.date)
        .bind('data', JSON.stringify(params.data));

    self.close = params.closeDialog;

    function addReport(entry) {
        return (params.type === "participant") ?
            serverService.addParticipantReport(params.userId, entry.identifier, entry) :
            serverService.addStudyReport(entry.identifier, entry);
    }

    self.save = function(vm, event) {
        var entry = binder.persist({});
        try {
            entry.data = JSON.parse(entry.data);
        } catch(e) {
            // not JSON.
        }

        var error = new BridgeError();
        if (!entry.identifier) {
            error.addError("identifier", "is required");
        }
        if (!entry.data) {
            error.addError("data", "is required");
        }
        if (error.hasErrors()) {
            return utils.failureHandler()(error);
        }

        utils.startHandler(vm, event);
        addReport(entry)
            .then(self.close)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler());
    };
};