import Binder from "../../binder";
import fn from "../../functions";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Shared assessment resource not found.",
  redirectTo: "assessments",
  transient: false,
  id: 'sharedassessment_resource'
});

export default function(params) {
  let self = this;
  // fix this before it drives you nuts...
  params.assessmentGuid = params.id;
  delete params.id;
  
  fn.copyProps(self, fn, "formatDateTime");

  let binder = new Binder(self)
    .obs("isAssessmentNew", false)
    .obs("isNew", false)
    .obs("assessmentGuid", params.assessmentGuid)
    .obs("assessmentId")
    .obs("pageTitle", "New Assessment")
    .obs("subPageTitle", "New Assessment Resource")
    .obs("pageRev")
    .obs("originGuid")

    .obs("guid")// resource GUID
    .bind("title")
    .bind("category")
    .obs('categoriesOptions[]', optionsService.getCategoryOptions())
    .bind("url")
    .bind("format")
    .bind("date")
    .bind("description")
    .bind("contributors[]", [])
    .bind("creators[]", [])
    .bind("publishers[]", [])
    .bind("language")
    .bind("minRevision")
    .bind("maxRevision")
    .bind("createdAtRevision")
    .bind("createdOn")
    .bind("modifiedOn");

  serverService.getSharedAssessment(params.assessmentGuid)
    .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
    .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
    .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
    .then(fn.handleObsUpdate(self.assessmentIdObs, "identifier"))
    .then((assessment) => serverService.getSharedAssessmentResource(assessment.identifier, params.guid))
    .then(binder.update())
    .then(binder.assign('resource'))
    .then(fn.handleObsUpdate(self.subPageTitleObs, "title"));
};
