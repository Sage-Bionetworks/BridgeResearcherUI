import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function(params) {
  let self = this;
  self.query = {};
  self.reload = () => load(self.query);

  fn.copyProps(self, fn, "isAdmin");

  new Binder(self)
    .obs("isNew", false)
    .obs("guid", params.guid)
    .obs("pageTitle")
    .obs("pageRev")
    .obs("originGuid")
    .obs("showDeleted", false)
    .bind("orgOptions[]");

  tables.prepareTable(self, {
    name: "assessment history",
    refresh: self.reload,
    id: "assessment_history"
  });

  // some nonsense related to the pager that I copy now by rote
  self.postLoadPagerFunc = () => {};
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;
  
  self.orgNames = {};

  self.formatTitle = function(item) {
    return `${item.title} (v${item.revision})`;
  }

  self.formatOrg = function(orgId) {
    return self.orgNames[orgId] ? self.orgNames[orgId] : orgId;
  }

  function load(query) {
    self.query = query;
    return serverService.getAssessmentRevisions(params.guid, query, self.showDeletedObs())
      .then(fn.log("revisions"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'assessment_history' }));
  }

  optionsService.getOrganizationNames()
    .then(map => self.orgNames = map)
    .then(() => serverService.getAssessment(params.guid))
    .then(fn.handleObsUpdate(self.pageRevObs, "pageRev"))
    .then(fn.handleObsUpdate(self.pageTitleObs, "pageTitle"))
    .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
    .then(() => ko.postbox.subscribe('asmh-refresh', self.load))
    .then(self.reload);

  //self.reload();
};
