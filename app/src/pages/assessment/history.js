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

  fn.copyProps(self, root, "isAdmin");

  let binder = new Binder(self)
    .obs("isNew", false)
    .obs("guid", params.guid)
    .obs("pageTitle")
    .obs("pageRev")
    .obs("originGuid")
    .obs("showDeleted", false)
    .bind("orgOptions[]")
    .bind("canEdit", false);

  tables.prepareTable(self, {
    name: "assessment revision",
    refresh: self.reload,
    id: "assessment_history",
    delete: (item) => serverService.deleteAssessment(item.guid, false),
    deletePermanently: (item) => serverService.deleteAssessment(item.guid, true),
    undelete: (item) => serverService.updateAssessment(item)
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
  
  function responseLookups(response) {
    response.items.forEach(lookupSharedTitle);
    return response;
  }
  function lookupSharedTitle(item) {
    item.originGuidObs = ko.observable(item.originGuid);
    if (item.originGuid) {
      serverService.getSharedAssessment(item.originGuid)
            .then(shared => item.originGuidObs(
              `<a target="_blank" href="#/sharedassessments/${shared.guid}">${shared.title}</a>`));
    }
  }

  function load(query) {
    self.query = query;
    return serverService.getAssessmentRevisions(params.guid, query, self.showDeletedObs())
      .then(responseLookups)
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'assessment_history' }));
  }

  serverService.getAssessment(params.guid)
    .then(assessment => self.assessment = assessment)
    .then(serverService.getSession)
    .then((session) => self.canEditObs(
        root.isAdmin() || self.assessment.ownerId === session.orgMembership))
    .then(optionsService.getOrganizationNames)
    .then((map) => self.orgNames = map)
    .then(() => serverService.getAssessment(params.guid))
    .then(binder.assign('assessment'))
    .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
    .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
    .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
    .then(() => ko.postbox.subscribe('asmh-refresh', self.load))
    .then(self.reload);
};
