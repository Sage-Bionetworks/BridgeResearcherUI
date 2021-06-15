import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import jsonFormatter from "../../json_formatter";
import serverService from "../../services/server_service";
import utils from "../../utils";
import BaseAssessment from "./base_assessment";

export default class AssessmentConfig extends BaseAssessment {
  constructor(params) {
    super(params, 'assessment-config');
    this.config = null;
    this.binder
      .bind("config", null, Binder.fromJson, Binder.toJson)
      .bind("version");

    super.load()
      .then(() => serverService.getAssessmentConfig(params.guid))
      .then(this.binder.assign("config"))
      .then(this.binder.update());
  }
  save(vm, event) {
    let config = this.binder.persist(this.config);
    utils.startHandler(vm, event);
    serverService.updateAssessmentConfig(this.guidObs(), config)
      .then(this.binder.update())
      .then(utils.successHandler(vm, event, "Assessment configuration has been saved."))
      .catch(this.failureHandler);
  }
  // TODO: This code is duplicated several places and could go in utils
  updateConfig() {
    if (this.configObs()) {
      try {
        let json = JSON.parse(this.configObs());
        this.configObs(jsonFormatter.prettyPrint(json));
      } catch (e) {
        let error = new BridgeError();
        error.addError("config", "is not valid JSON");
        this.failureHandler(error);
        return true;
      }
    }
    return false;
  }
  reformat() {
    utils.clearErrors();
    this.updateConfig();
  };
  configFormatted(json) {
    return jsonFormatter.prettyPrintStringAsHTML(json);
  }
}
