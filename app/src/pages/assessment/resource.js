import BaseAssessment from "./base_assessment";
import Binder from "../../binder";
import fn from "../../functions";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default class AssessmentResource extends BaseAssessment {
  constructor(params) {
    super({guid: params.id}, 'assessment-resource');
    this.resource = this.newAssessmentResource();

    this.resourceFailureHandler = utils.failureHandler({
      redirectMsg: "Assessment resource not found.",
      redirectTo: "assessments/"+params.id+"/resources",
      transient: false,
      id: 'assessment-resource'
    });

    this.resourceBinder = new Binder(this)
      .obs("subPageTitle", "New Assessment Resource")
      .bind("resourceGuid", params.guid)
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

    super.load()
      .then(this.loadAssessmentResource.bind(this))
      .then(this.resourceBinder.update())
      .then(fn.handleObsUpdate(this.resourceGuidObs, "guid"))
      .then(fn.handleObsUpdate(this.subPageTitleObs, "title"))
      .then(this.resourceBinder.assign('resource'))
      .catch(this.resourceFailureHandler);
  }
  newAssessmentResource() {
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
  loadAssessmentResource() {
    return serverService.getAssessmentResource(this.identifierObs(), this.resourceGuidObs());
  }
  saveAssessmentResource(resource) {
    return serverService.updateAssessmentResource(this.identifierObs(), resource);
  }
  save(vm, event) {
    this.resource = this.resourceBinder.persist(this.resource);

    utils.startHandler(vm, event);
    this.saveAssessmentResource(this.resource)
      .then(this.resourceBinder.assign("resource"))
      .then(this.resourceBinder.update())
      .then(fn.handleObsUpdate(this.subPageTitleObs, "title"))
      .then(fn.handleObsUpdate(this.resourceGuidObs, "guid"))
      .then(utils.successHandler(vm, event, "Assessment resource has been saved."))
      .then(() => document.location = `#/assessments/${this.guidObs()}/resources/${this.resourceGuidObs()}`)
      .catch(this.failureHandler);
  }
}
