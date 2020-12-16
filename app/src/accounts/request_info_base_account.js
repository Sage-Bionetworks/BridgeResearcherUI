import BaseAccount from "./base_account";
import Binder from "../binder";
import fn from "../functions";
import serverService from "../services/server_service";
import utils from "../utils";

function joiner(value) {
  return value && value.length ? value.join(", ") : "<none>";
}
function stringer(value) {
  let array = [];
  if (value) {
    delete value.type;
    for (let prop in value) {
      array.push(prop + " = " + value[prop]);
    }
  }
  return array.join("<br>");
}
function dater(value) {
  return value ? fn.formatDateTime(value) : "<none>";
}
function noner(value) {
  return value ? value : "<none>";
}

export default class RequestInfoBaseAccount extends BaseAccount {
  constructor(params) {
    super(params);

    this.binder = new Binder(this)
      .obs("name", "")
      .obs("languages", null, joiner)
      .obs("userDataGroups", null, joiner)
      .obs("signedInOn", null, dater)
      .obs("clientInfo", null, stringer)
      .obs("uploadedOn", null, dater)
      .obs("activitiesAccessedOn", null, dater)
      .obs("timeZone", null, noner)
      .obs("userAgent", null, noner);

    this.getAccount()
      .then(() => this.requestInfo())
      .then(this.binder.update())
      .catch(utils.failureHandler(this.failureParams));
  }
  loadAccount() { 
    return serverService.getParticipant(this.userId);
  }
  requestInfo() {
    return serverService.getParticipantRequestInfo(this.userId);
  }
}
