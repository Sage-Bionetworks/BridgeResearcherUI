import fn from '../../functions';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import serverService  from '../../services/server_service';
import utils from '../../utils';

module.exports = class AddReport {
    constructor(params) {
        fn.copyProps(this, params, 'type', 'userId', 'closeDialog->close');

        this.binder = new Binder(this)
            .obs('showIdentifier', !fn.isDefined(params.identifier))
            .obs('title', params.data ? "Edit report record" : "Add report record")
            .bind('identifier', params.identifier)
            .bind('date', AddReport.getLocalDate(params.date), null, AddReport.getLocalDate)
            .bind('data', AddReport.jsonAsString(params.data), null, AddReport.stringAsJson);
    }
    addReport(entry) {
        return (this.type === "participant") ?
            serverService.addParticipantReport(this.userId, entry.identifier, entry) :
            serverService.addStudyReport(entry.identifier, entry);
    }
    save(vm, event) {
        var entry = this.binder.persist({});

        var error = new BridgeError();
        error.addErrorIf(!entry.identifier, "identifier", "is required");
        error.addErrorIf(!entry.data, "data", "is required");

        if (!error.displayErrors()) {
            utils.startHandler(vm, event);
            this.addReport(entry)
                .then(this.close)
                .then(utils.successHandler(vm, event))
                .catch(utils.failureHandler());
        }
    }
    static getLocalDate(value) {
        var date = value || new Date();
        return fn.asDate(date).toISOString().split("T")[0];
    }
    static stringAsJson(value, context) {
        try {
            return JSON.parse(value);
        } catch(e) {
            return value;
        }
    }
    static jsonAsString(value) {
        return (value) ? JSON.stringify(value) : value;
    }
};
