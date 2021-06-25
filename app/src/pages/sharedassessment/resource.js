import BaseSharedAssessment from "./base_shared_assessment";
import Binder from "../../binder";
import fn from "../../functions";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default class SharedAssessmentResource extends BaseSharedAssessment {
  constructor(params) {
    super({guid: params.id}, 'sharedassessment-resource');
    
    this.resource = this.newSharedAssessmentResource();

    this.resourceFailureHandler = utils.failureHandler({
      redirectMsg: "Shared assessment resource not found.",
      redirectTo: "sharedassessments/"+this.guid+"/resources",
      transient: false,
      id: 'sharedassessment-resource'
    });
    
    this.resourceBinder = new Binder(this)
      .obs("isNew", false)
      .obs("subPageTitle", "New Shared Assessment Resource")
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
      .catch(this.resourceFailureHandler);
  }
  newSharedAssessmentResource() {
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
    if (this.resourceGuidObs() === 'new') {
      return Promise.resolve(this.newSharedAssessmentResource())
        .then(this.resourceBinder.update())
        .then(this.resourceBinder.assign('resource'));
    } else {
      return serverService.getSharedAssessmentResource(this.assessment.identifier, this.resourceGuidObs())
        .then(this.resourceBinder.update())
        .then(fn.handleObsUpdate(this.resourceGuidObs, "guid"))
        .then(fn.handleObsUpdate(this.subPageTitleObs, "title"))
        .then(this.resourceBinder.assign('resource'))
    }
  }
  doImport(vm, event) {
    utils.startHandler(vm, event);
    serverService.importAssessmentResource(this.assessment.identifier, this.resource.guid)
      .then(utils.successHandler(vm, event, "Assessment resource has been imported."))
      .catch(this.resourceFailureHandler);
  }
  saveSharedAssessmentResource(resource) {
    if (this.resourceGuidObs() === 'new') {
      return serverService.createSharedAssessmentResource(this.assessment.identifier, resource);
    } else {
      return serverService.updateSharedAssessmentResource(this.assessment.identifier, resource);
    }
  }
  save(vm, event) {
    this.resource = this.resourceBinder.persist(this.resource);

    utils.startHandler(vm, event);
    this.saveSharedAssessmentResource(this.resource)
      .then(this.resourceBinder.assign("resource"))
      .then(this.resourceBinder.update())
      .then(fn.handleObsUpdate(this.subPageTitleObs, "title"))
      .then(fn.handleObsUpdate(this.resourceGuidObs, "guid"))
      .then(utils.successHandler(vm, event, "Assessment resource has been saved."))
      .then(() => document.location = `#/sharedassessments/${this.guidObs()}/resources/${this.resourceGuidObs()}`)
      .catch(this.failureHandler);
  }
}