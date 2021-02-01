import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import password from "../../password_generator";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function externalIds(params) {
  let self = this;
  self.vm = this;

  self.query = {};
  self.userStudies = [];

  let binder = new Binder(self)
    .obs("title", "New Study")
    .obs("isNew", false)
    .obs("items[]", [])
    .obs("total", 0)
    .obs("result", "")
    .obs("searchLoading", false)
    .obs("idFilter")
    .obs("studyId", params.studyId)
    .bind("identifier", params.studyId)
    .obs("showResults", false);

  fn.copyProps(self, root, "isAdmin", "isDeveloper", "isResearcher");
  
  tables.prepareTable(self, {
    refresh: () => self.load(self.query),
    name: "external ID",
    delete: (item) => serverService.deleteExternalId(item.identifier),
    id: 'external-ids'
  });

  self.postLoadPagerFunc = fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;

  function initFromSession(session) {
    self.userStudies = session.studyIds;
    return serverService.getApp();
  }

  self.openImportDialog = function(vm, event) {
    self.showResultsObs(false);
    root.openDialog("external_id_importer", {
      vm: self,
      studyId: params.studyId,
      reload: self.load.bind(self)
    });
  };
  self.link = (item) => 
    `#/studies/${params.studyId}/participants/${encodeURIComponent("externalId:" + item.identifier)}/general`;
  self.doSearch = (event) => {
    event.preventDefault();
    event.stopPropagation();
    self.load(self.query);
  };

  self.matchesStudy = (studyId) => fn.studyMatchesUser(self.userStudies, studyId);

  serverService.getSession()
    .then(initFromSession)
    .then(binder.assign("app"))
    .then(() => serverService.getStudy(params.studyId))
    .then(fn.handleObsUpdate(self.titleObs, "name"))
    .catch(utils.failureHandler({ id: 'external-ids' }));

  self.load = function(query) {
    query = query || {};
    self.query = query;
    self.query.idFilter = self.idFilterObs();
    return serverService.getExternalIdsForStudy(params.studyId, self.query)
      .then(binder.update("total", "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'external-ids' }));
  }
  self.loadingFunc = self.load;
  ko.postbox.subscribe('external-ids-refresh', self.load);
};
