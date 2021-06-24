import BaseSharedAssessment from "./base_shared_assessment";
import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import tables from "../../tables";

export default class SharedAssessmentResources extends BaseSharedAssessment {
  constructor(params) {
    super(params, 'sharedassessment-resources');
    // some nonsense related to the pager that I copy now by rote
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;

    this.binder
      .obs("forRevision")
      .obs('categories[]')
      .obs('categoriesOptions[]', optionsService.getCategoryOptions())
      .obs('category');

    // rather than doing this many times
    this.loadResources = this.loadResources.bind(this);

    function delItem(id, guid, inclDel) {
      return serverService.deleteSharedAssessmentResource(id, guid, inclDel);
    }
    function upItem(id, item) {
      return serverService.updateSharedAssessmentResource(id, item);
    }
    function pubItem(id, guid) {
      return serverService.importSharedAssessmentResources(id, [guid]);
    }

    tables.prepareTable(this, {
      name: "shared assessment resource",
      refresh: () => this.loadResources(),
      id: "sharedassessment-resources",
      delete: (item) => delItem(this.identifierObs(), item.guid, false),
      deletePermanently: (item) => delItem(this.identifierObs(), item.guid, true),
      undelete: (item) => upItem(this.identifierObs(), item),
      publish: (item) => pubItem(this.identifierObs(), [item.guid])
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
  image(item) {
    let src = '/images/globe.svg';
    let size = '25%';
    if (item.format && item.url && item.format.startsWith('image/')) {
      src = item.url;
      size = 'contain';
    }
    return { 
      'height': '10rem',
      'background-repeat': 'no-repeat',
      'background-position': 'center',
      'background-size': size,
      'background-image': 'url('+src+')'
    };
  }
  loadResources() {
    let query = {};
    query.category = this.categoryObs() ? [this.categoryObs()] : null;
    query.minRevision = this.forRevisionObs();
    query.maxRevision = this.forRevisionObs();

    return serverService.getSharedAssessmentResources(this.identifierObs(), query, this.showDeletedObs())
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(this.postLoadPagerFunc)
      .catch(this.failureHandler);
  }
}
