import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default class Assessments {
  constructor(params) {
    this.query = {};
    this.orgNames = {};

    tables.prepareTable(this, {
      name: "assessment",
      refresh: this.load.bind(this),
      id: "assessments",
      delete: (item) => serverService.deleteAssessment(item.guid, false),
      deletePermanently: (item) => serverService.deleteAssessment(item.guid, true),
      undelete: (item) => serverService.updateAssessment(item)
    });
  
    // some nonsense related to the pager that I copy now by rote
    fn.copyProps(this, root, "isAdmin");
    this.tagsObs = ko.observable('');
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;

    ko.postbox.subscribe('asm-refresh', this.load.bind(this));
  }
  canDelete() {
    return root.isDeveloper() || root.isStudyDesigner() || root.isAdmin();
  }
  canEdit() {
    return root.isDeveloper() || root.isStudyDesigner() || root.isAdmin();
  }
  formatOrg(orgId) {
    return this.orgNames[orgId] ? this.orgNames[orgId] : orgId;
  }
  load(query) {
    console.log(this);
    query.tags = this.tagsObs();
    this.query = query;

    optionsService.getOrganizationNames()
      .then((response) => this.orgNames = response)
      .then(() => serverService.getAssessments(
          query.tags, query.offsetBy, query.pageSize, this.showDeletedObs()))
      .then(utils.resolveDerivedFrom)
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(this.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'assessments' }));
  }
}
