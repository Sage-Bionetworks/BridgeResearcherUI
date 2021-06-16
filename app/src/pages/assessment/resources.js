import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import optionsService from "../../services/options_service";
import BaseAssessment from "./base_assessment";

export default class AssessmentResources extends BaseAssessment {
  constructor(params) {
    super(params, 'assessment-resources');
    this.query = {};
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;
  
    fn.copyProps(this, root, "isAdmin");
    this.loadResources = this.loadResources.bind(this);

    this.binder
      .obs("forRevision")
      .obs('categories[]')
      .obs('categoriesOptions[]', optionsService.getCategoryOptions())
      .obs('category');

    tables.prepareTable(this, {
      name: "assessment documentation resource",
      refresh: this.loadResources,
      id: "assessment-resources",
      delete: (item) => serverService.deleteAssessmentResource(this.identifierObs(), item.guid, false),
      deletePermanently: (item) => serverService.deleteAssessmentResource(this.identifierObs(), item.guid, true),
      undelete: (item) => serverService.updateAssessmentResource(this.identifierObs(), item),
      publish: (item) => {
        return serverService.getSharedAssessment(this.originGuidObs())
          .then(shared => serverService.publishAssessmentResources(shared.identifier, [item.guid]));
      }
    });

    super.load()
      .then(this.loadResources)
      .then(() => {
        ko.postbox.subscribe('asmr-refresh', this.loadResources);
        this.forRevisionObs.subscribe(this.loadResources);
        this.categoryObs.subscribe(this.loadResources);
      })
      .catch(this.failureHandler);
  }
  formatCategory(value) {
    return optionsService.CATEGORY_LABELS[value];
  }
  formatRevisions(resource) {
    if (resource.minRevision && resource.maxRevision) {
      if (resource.minRevision === resource.maxRevision) {
        return resource.minRevision;
      }
      return resource.minRevision + '—' + resource.maxRevision;
    } else if (resource.minRevision) {
      return resource.minRevision + '—';
    } else if (resource.maxRevision) {
      return '—' + resource.maxRevision;
    }
    return '';
  }
  loadResources(query) {
    this.query = (typeof query === 'object') ? query : this.query;
    this.query.category = this.categoryObs() ? [this.categoryObs()] : null;
    this.query.minRevision = this.forRevisionObs();
    this.query.maxRevision = this.forRevisionObs();

    return serverService.getAssessmentResources(this.identifierObs(), this.query, this.showDeletedObs())
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(this.postLoadPagerFunc)
      .catch(this.failureHandler);
  }
}
