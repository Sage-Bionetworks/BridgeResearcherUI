import Binder from "../../binder";
import fn from "../../functions";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

function newAssessmentResource() {
  return {
    'title': '',
    'category': null,
    'url': '',
    'format': '',
    'date': '',
    'description': '',
    'contributors': [],
    'creators': [],
    'publishers': [],
    'language': 'en',
    'minRevision': null,
    'maxRevision': null,
    'createdAtRevision': null
  };
}

var failureHandler = utils.failureHandler({
  redirectMsg: "Assessment resource not found.",
  redirectTo: "assessments",
  transient: false,
  id: 'assessment_resource'
});

export default function(params) {
  let self = this;
  // fix this before it drives you nuts...
  params.assessmentGuid = params.id;
  delete params.id;
  
  self.resource = newAssessmentResource();

  fn.copyProps(self, fn, "formatDateTime");

  let binder = new Binder(self)
    .obs("isAssessmentNew", false)
    .obs("isNew", params.guid === "new")
    .obs("assessmentGuid", params.assessmentGuid)
    .obs("assessmentId")
    .obs("pageTitle", "New Assessment")
    .obs("subPageTitle", "New Assessment Resource")
    .obs("pageRev")
    .obs("originGuid")
    .obs("canEdit", false)

    .obs("guid")// resource GUID
    .bind("title")
    .bind("category")
    .obs('categoriesOptions[]', optionsService.getCategoryOptions())
    .bind("url")
    .bind("format")
    .bind("date")
    .bind("description")
    .bind("contributors[]")
    .bind("creators[]")
    .bind("publishers[]")
    .bind("language")
    .bind("minRevision")
    .bind("maxRevision")
    .bind("createdAtRevision")
    .bind("createdOn")
    .bind("modifiedOn");

  function loadAssessmentResource(assessment) {
    if (self.isNewObs()) {
      return Promise.resolve(newAssessmentResource());
    } else {
      return serverService.getAssessmentResource(assessment.identifier, params.guid);
    }
  }

  function saveAssessmentResource(resource) {
    if (self.isNewObs()) {
      return serverService.createAssessmentResource(self.assessmentIdObs(), resource);
    } else {
      return serverService.updateAssessmentResource(self.assessmentIdObs(), resource);
    }
  }

  self.save = function(vm, event) {
    self.resource = binder.persist(self.resource);

    utils.startHandler(vm, event);
    saveAssessmentResource(self.resource)
      .then(fn.handleStaticObsUpdate(self.isNewObs, false))
      .then(binder.assign("resource"))
      .then(binder.update())
      .then(fn.handleObsUpdate(self.subPageTitleObs, "title"))
      .then(utils.successHandler(vm, event, "Assessment resource has been saved."))
      .then(() => document.location = `#/assessments/${self.assessmentGuidObs()}/resources/${self.guidObs()}`)
      .catch(failureHandler);
  }

  serverService.getAssessment(params.assessmentGuid)
    .then(binder.assign('assessment'))
    .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
    .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
    .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
    .then(fn.handleObsUpdate(self.assessmentIdObs, "identifier"))
    .then(loadAssessmentResource)
    .then(binder.update())
    .then(binder.assign('resource'))
    .then(fn.handleObsUpdate(self.subPageTitleObs, "title"))
    .then(serverService.getSession)
    .then((session) => self.canEditObs(fn.canEditAssessment(self.assessment, session)));
};
