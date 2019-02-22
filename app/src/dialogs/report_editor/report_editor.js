import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import fn from "../../functions";
import utils from "../../utils";

function formatDateISO(value) {
  return fn.formatDate(value, "iso");
}

module.exports = class AddReport {
  constructor(params) {
    fn.copyProps(this, params, "type", "userId", "closeDialog->close");

    this.binder = new Binder(this)
      .obs("showIdentifier", !fn.isDefined(params.identifier))
      .obs("title", params.data ? "Edit report record" : "Add report record")
      .bind("identifier", params.identifier)
      .bind("date", AddReport.getLocalDate(params.date), null, formatDateISO)
      .bind("data", AddReport.jsonAsString(params.data), null, AddReport.stringAsJson);
  }
  addReport(entry) {
    return this.type === "participant"
      ? serverService.addParticipantReport(this.userId, entry.identifier, entry)
      : serverService.addStudyReport(entry.identifier, entry);
  }
  save(vm, event) {
    let entry = this.binder.persist({});

    let error = new BridgeError();
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
    return fn.formatDate(value, "iso");
  }
  static stringAsJson(value, context) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  static jsonAsString(value) {
    return value ? JSON.stringify(value) : value;
  }
};
