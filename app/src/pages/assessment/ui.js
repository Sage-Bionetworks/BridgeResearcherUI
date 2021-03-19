import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Assessment not found.",
  redirectTo: "assessments",
  transient: false,
  id: 'assessment-ui'
});

export default function(params) {
  let self = this;
  self.assessment = null

  fn.copyProps(self, fn, "formatDateTime");

  let binder = new Binder(self)
    .obs("isNew", params.guid === "new")
    .obs("guid")
    .obs("createdOn")
    .obs("modifiedOn")
    .obs("pageTitle", "New Assessment")
    .obs("pageRev")
    .bind("version")
    .bind("identifier")
    .bind("ownerId")
    .bind("originGuid")
    .bind("minutesToComplete")
    .bind('labels[]', null, null, Binder.persistArrayWithBinder)
    .bind("background", null, Binder.fromObjectField("colorScheme", "background"),
        Binder.toObjectField("colorScheme", "background"))
    .bind("foreground", null, Binder.fromObjectField("colorScheme", "foreground"),
        Binder.toObjectField("colorScheme", "foreground"))
    .bind("activated", null, Binder.fromObjectField("colorScheme", "activated"),
        Binder.toObjectField("colorScheme", "activated"))
    .bind("inactivated", null, Binder.fromObjectField("colorScheme", "inactivated"),
        Binder.toObjectField("colorScheme", "inactivated"))
    .obs("canEdit", false);
  fn.copyProps(self, fn, "formatDateTime");

  function saveAssessment() {
    return serverService.updateAssessment(self.assessment)
      .then(binder.assign("assessment"))
      .then(binder.update())
      .then(fn.returning(self.assessment));
  }
  function load() {
    return serverService.getAssessment(params.guid)
      .then(binder.assign("assessment"))
      .then(binder.update())
      .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
      .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
      .then(serverService.getSession)
      .then((session) => self.canEditObs(
        root.isSuperadmin() || self.assessment.ownerId === session.orgMembership));
  }

  self.save = function(vm, event) {
    self.assessment = binder.persist(self.assessment);

    utils.startHandler(vm, event);
    saveAssessment()
      .then(utils.successHandler(vm, event, "Assessment has been saved."))
      .catch(failureHandler);
  };

  self.addLabel = function() {
    self.labelsObs.push({});
  }

  load();
};
