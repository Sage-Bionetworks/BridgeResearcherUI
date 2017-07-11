import fn from '../../functions';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import serverService  from '../../services/server_service';
import utils from '../../utils';

module.exports = class AddReport {
    constructor(params) {
        this.type = params.type;
        this.userId = params.userId;

        this.binder = new Binder(this)
            .obs('showIdentifier', typeof params.identifier === "undefined")
            .bind('identifier', params.identifier)
            .bind('date', new Date().toISOString().split("T")[0], null, AddReport.getLocalDate)
            .bind('data');

        this.close = params.closeDialog;
    }
    addReport(entry) {
        return (this.type === "participant") ?
            serverService.addParticipantReport(this.userId, entry.identifier, entry) :
            serverService.addStudyReport(entry.identifier, entry);
    }
    save(vm, event) {
        var entry = this.binder.persist({});
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
        this.addReport(entry)
            .then(this.close)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler());
    }
    static getLocalDate(value) {
        return fn.asDate(value).toISOString().split("T")[0];
    }
}
