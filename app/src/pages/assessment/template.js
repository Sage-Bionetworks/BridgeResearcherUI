import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import config from "../../config";
import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Assessment not found.",
  redirectTo: "assessments",
  transient: false,
  id: 'assessment_template'
});

export default function(params) {
  let self = this;

  let binder = new Binder(self)
    .obs("isNew", false)
    .obs("guid")
    .obs("pageTitle", "New Assessment")
    .obs("pageRev")
    .obs("editors[]")
    .obs("originGuid")
    .obs("canEdit", false)
    .bind("customizationFields", null, Binder.fromCustomizationFields, Binder.toCustomizationFields);
  fn.copyProps(self, fn, "formatDateTime");
      
  self.save = function(vm, event) {
    self.assessment = binder.persist(self.assessment);

    utils.startHandler(vm, event);
    serverService.updateAssessment(self.assessment)
      .then(binder.assign("assessment"))
      .then(binder.update())
      .then(utils.successHandler(vm, event, "Assessment has been saved."))
      .catch(failureHandler);
  };

  self.addEditor = function() {
    let editor = {
      propNameObs: ko.observable(),
      labelObs: ko.observable(),
      descriptionObs: ko.observable(),
      propTypeObs: ko.observable(),
      propTypeOptions: config.assessmentPropTypes,
      identifierObs: ko.observable()
    }
    self.editorsObs.push(editor);
  };
  self.removeEditor = function(editor, event) {
    alerts.deleteConfirmation("Are you sure you wish to delete this?", function() {
      self.editorsObs.remove(editor);
    }, "Delete");
  }

  serverService.getAssessment(params.guid)
    .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
    .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
    .then(binder.assign("assessment"))
    .then(binder.update())
    .then(serverService.getSession)
    .then((session) => self.canEditObs(fn.canEditAssessment(self.assessment, session)));
};
