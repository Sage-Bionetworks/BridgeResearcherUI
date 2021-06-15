import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import password from "../../password_generator";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";
import BaseStudy from "./base_study";

export default class StudyExternalIds extends BaseStudy {
  constructor(params) {
    super(params, 'external-ids');

    this.query = {};
    this.userStudies = [];
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;

    tables.prepareTable(this, {
      refresh: () => this.loadExternalIds(this.query),
      name: "external ID",
      delete: (item) => serverService.deleteExternalId(item.identifier),
      id: 'external-ids'
    });

    console.log("this.itemsObs", this.itemsObs);
  
    this.binder
      .obs("total", 0)
      .obs("result")
      .obs("searchLoading", false)
      .obs("idFilter")
      .obs("showResults", false);

    fn.copyProps(this, root, "isAdmin", "isDeveloper", "isResearcher");

    this.doSearch = this.doSearch.bind(this);

    ko.postbox.subscribe('external-ids-refresh', this.loadExternalIds.bind(this));

    serverService.getSession()
      .then(this.initFromSession.bind(this))
      .then(this.binder.assign("app"))
      .then(() => super.load());
  }
  initFromSession(session) {
    this.userStudies = session.studyIds;
    return serverService.getApp();
  }
  openImportDialog(vm, event) {
    this.showResultsObs(false);
    root.openDialog("external_id_importer", {
      vm: this,
      studyId: this.studyId,
      reload: this.loadExternalIds.bind(this)
    });
  }
  link(item)  {
    return`#/studies/${this.studyId}/participants/${encodeURIComponent("externalId:" + 
      item.identifier)}/general`;
  }
  doSearch(event) {
    event.preventDefault();
    event.stopPropagation();
    this.loadExternalIds(this.query);
  }
  matchesStudy(studyId) {
    fn.studyMatchesUser(this.userStudies, studyId);
  }
  loadExternalIds(query) {
    query = query || {};
    this.query = query;
    this.query.idFilter = this.idFilterObs();
    return serverService.getExternalIdsForStudy(this.studyId, this.query)
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(this.postLoadPagerFunc)
      .catch(this.failureHandler);
  }
}
