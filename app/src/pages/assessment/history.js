import fn from "../../functions";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";
import BaseAssessment from "./base_assessment";

export default class AssessmentHistory extends BaseAssessment {
  constructor(params) {
    super(params, 'assessment-history');
    this.query = {};
    this.orgNames = {};
    // some nonsense related to the pager that I copy now by rote
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;

    fn.copyProps(this, root, "isAdmin");

    this.binder
      .obs("showDeleted", false)
      .bind("orgOptions[]");

    tables.prepareTable(this, {
      name: "assessment revision",
      refresh: this.loadRevisions.bind(this),
      id: "assessment-history",
      delete: (item) => serverService.deleteAssessment(item.guid, false),
      deletePermanently: (item) => serverService.deleteAssessment(item.guid, true),
      undelete: (item) => serverService.updateAssessment(item)
    });

    super.load()
      .then(optionsService.getOrganizationNames)
      .then((map) => this.orgNames = map)
      .then(() => this.loadRevisions(this.query));
  }
  formatTitle(item) {
    return `${item.title} (v${item.revision})`;
  }
  formatOrg(orgId) {
    return this.orgNames[orgId] ? this.orgNames[orgId] : orgId;
  }
  loadRevisions(query) {
    this.query = query;
    return serverService.getAssessmentRevisions(this.guidObs(), query, this.showDeletedObs())
      .then(utils.resolveDerivedFrom)
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(this.postLoadPagerFunc)
      .catch(this.failureHandler);
  }
}
