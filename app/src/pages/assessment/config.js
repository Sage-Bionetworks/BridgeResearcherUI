import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Assessment not found.",
  redirectTo: "assessments",
  transient: false,
  id: 'assessment_config'
});

export default function(params) {
  let self = this;
  self.config = null;

  let binder = new Binder(self)
    .obs("isNew", false)
    .obs("guid", params.guid)
    .obs("originGuid")
    .obs("pageTitle", "New Assessment")
    .obs("pageRev")
    .obs("canEdit")
    .obs('createdOn')
    .obs('modifiedOn')
    .bind("config", null, Binder.fromJson, Binder.toJson)

  self.save = function(vm, event) {
    let config = binder.persist(self.config);
    utils.startHandler(vm, event);
    serverService.updateAssessmentConfig(params.guid, config)
      .then(binder.update())
      .then(utils.successHandler(vm, event, "Assessment configuration has been saved."))
      .catch(failureHandler);
  };

  // TODO: This code is duplicated several places and could go in utils
  function updateConfig() {
    if (self.configObs()) {
      try {
        let json = JSON.parse(self.configObs());
        self.configObs(jsonFormatter.prettyPrint(json));
      } catch (e) {
        let error = new BridgeError();
        error.addError("config", "is not valid JSON");
        utils.failureHandler({ transient: false, id: 'assessment_config' })(error);
        return true;
      }
    }
    return false;
  }
  self.reformat = function() {
    utils.clearErrors();
    updateConfig();
  };
  self.configFormatted = function(json) {
    return jsonFormatter.prettyPrintStringAsHTML(json);
  }
  
  serverService.getAssessment(params.guid)
    .then(binder.assign('assessment'))
    .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
    .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
    .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
    .then(() => serverService.getAssessmentConfig(params.guid))
    .then(binder.assign("config"))
    .then(binder.update())
    .then(serverService.getSession)
    .then((session) => self.canEditObs(fn.canEditAssessment(self.assessment, session)));
};
