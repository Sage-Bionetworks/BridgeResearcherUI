import Binder from "../../binder";
import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Assessment not found.",
  redirectTo: "assessments",
  transient: false,
  id: 'sharedassessment_config'
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
    .obs('isNew', false)
    .bind('createdOn')
    .bind('modifiedOn')
    .bind("config", null, Binder.fromJson, Binder.toJson)

  // TODO: This code is duplicated several places and could go in utils
  function updateConfig() {
    if (self.configObs()) {
      try {
        let json = JSON.parse(self.configObs());
        self.configObs(jsonFormatter.prettyPrint(json));
      } catch (e) {
        let error = new BridgeError();
        error.addError("config", "is not valid JSON");
        failureHandler(error);
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

  serverService.getSharedAssessment(params.guid)
    .then(binder.assign('assessment'))
    .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
    .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
    .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
    .then(() => serverService.getSharedAssessmentConfig(params.guid))
    .then(binder.assign("config"))
    .then(binder.update())
    .then(serverService.getSession)
    .then((session) => self.canEditObs(fn.canEditAssessment(self.assessment, session)))
    .catch(failureHandler);
};
