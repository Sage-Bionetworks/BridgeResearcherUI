import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import tables from "../../tables";
import BaseSharedAssessment from "./base_shared_assessment";

export default class SharedAssessmentHistory extends BaseSharedAssessment {
  constructor(params) {
    super(params, 'sharedassessment-history');
    
    this.orgNames = {};
    this.assessment = null;
    this.guid = params.guid;
    // some nonsense related to the pager that I copy now by rote
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;

    this.binder.obs('showDeleted', false)

    tables.prepareTable(this, {
      name: "sharedassessment history",
      refresh: this.loadRevisions.bind(this),
      id: 'sharedassessment-history'
    });

    optionsService.getOrganizationNames()
      .then(map => this.orgNames = map)
      .then(() => super.load())
      .then(() => this.loadRevisions())
      .then(() => ko.postbox.subscribe('asmh-refresh', this.loadRevisions.bind(this)));
  }
  formatTitle(item) {
    return `${item.title} (v${item.revision})`;
  }
  formatOrg(orgId) {
    return this.orgNames[orgId] ? this.orgNames[orgId] : orgId;
  }
  loadRevisions(query = {}) {
    return serverService.getSharedAssessmentRevisions(this.guid, query, this.showDeletedObs())
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(this.postLoadPagerFunc)
      .catch(this.failureHandler);
  }

}
