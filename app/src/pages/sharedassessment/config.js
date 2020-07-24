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
    .obs("canEdit", false)
    .bind("config", null, Binder.fromJson, Binder.toJson)

  self.configFormatted = function(json) {
    return jsonFormatter.prettyPrintStringAsHTML(json);
  }
  
  serverService.getSharedAssessment(params.guid)
    .then(binder.assign('assessment'))
    .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
    .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
    .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
    .then(() => serverService.getSharedAssessmentConfig(params.guid))
    .then(fn.log('config'))
    .then(binder.assign("config"))
    .then(binder.update())
    .then(serverService.getSession)
    .then((session) => self.canEditObs(
      root.isSuperadmin() || self.assessment.ownerId === session.orgMembership));

};
