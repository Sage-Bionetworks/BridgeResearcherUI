import BridgeError from "../../bridge_error";
import jsonFormatter from "../../json_formatter";
import serverService from "../../services/server_service";
import utils from "../../utils";
import BaseStudy from "./base_study";

export default class StudyClientData extends BaseStudy {
  constructor(params) {
    super(params, 'study-client-data');
    this.binder
      .obs("name")
      .obs("clientData");

    super.load().then(this.setClientData.bind(this));
  }
  save (vm, event) {
    utils.clearErrors();
    if (!this.updateClientData()) {
      return;
    }
    utils.startHandler(vm, event);
    serverService.updateStudy(this.study)
      .then(res => this.study.version = res.version)
      .then(utils.successHandler(vm, event, "Study updated."))
      .catch(this.failureHandler);
  }
  reformat() {
    utils.clearErrors();
    this.updateClientData();
  }
  updateClientData() {
    try {
      if (this.clientDataObs()) {
        this.study.clientData = JSON.parse(this.clientDataObs());
        this.clientDataObs(jsonFormatter.prettyPrint(this.study.clientData));
      } else {
        delete this.study.clientData;
      }
    } catch (e) {
      let error = new BridgeError();
      error.addError("clientData", "is not valid JSON");
      utils.failureHandler({ id: 'study-client-data', transient: false })(error);
      return false;
    }
    return true;
  }
  setClientData(study) {
    if (study.clientData) {
      this.clientDataObs(jsonFormatter.prettyPrint(study.clientData));
    } else {
      this.clientDataObs("{}");
    }
  }
}