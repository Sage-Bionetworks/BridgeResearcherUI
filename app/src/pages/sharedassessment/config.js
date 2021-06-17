import Binder from "../../binder";
import jsonFormatter from "../../json_formatter";
import serverService from "../../services/server_service";
import utils from "../../utils";
import BaseSharedAssessment from "./base_shared_assessment";

export default class SharedAssessmentConfig extends BaseSharedAssessment {
  constructor(params) {
    super(params, 'sharedassessment-config');
    this.config = null;

    this.binder.bind("config", null, Binder.fromJson, Binder.toJson)

    super.load()
      .then(() => serverService.getSharedAssessmentConfig(params.guid))
      .then(this.binder.assign("config"))
      .then(this.binder.update())
      .catch(this.failureHandler);
  }
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
