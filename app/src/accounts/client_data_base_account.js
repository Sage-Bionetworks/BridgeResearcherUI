import BaseAccount from "./base_account";
import BridgeError from "../bridge_error";
import jsonFormatter from "../json_formatter";
import utils from "../utils";

export default class ClientDataBaseAccount extends BaseAccount {
  constructor(params) {
    super({...params, errorId: 'participant-client-data'});

    this.binder.obs("startDate")
      .obs("endDate")
      .obs("clientData");

    this.getAccount().then(res => this.setClientData(res));
  }
  setClientData(response) {
    this.account = response;
    if (response.clientData) {
      this.clientDataObs(jsonFormatter.prettyPrint(response.clientData));
    } else {
      this.clientDataObs("");
    }
  }
  updateClientData() {
    try {
      if (this.clientDataObs()) {
        this.account.clientData = JSON.parse(this.clientDataObs());
        this.clientDataObs(jsonFormatter.prettyPrint(this.account.clientData));
      } else {
        delete this.account.clientData;
      }
    } catch (e) {
      let error = new BridgeError();
      error.addError("clientData", "is not valid JSON");
      utils.failureHandler({ ...this.failureParams, transient: false })(error);
      return false;
    }
    return true;
  }
  save(vm, event) {
    utils.clearErrors();
    if (!this.updateClientData()) {
      return;
    }
    utils.startHandler(vm, event);
    this.updateAccount()
      .then(utils.successHandler(vm, event, "Client data updated."))
      .catch(utils.failureHandler(this.failureParams));
  }
  reformat(vm, event) {
    utils.clearErrors();
    this.updateClientData();
  }
}