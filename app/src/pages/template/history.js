import Binder from "../../binder";
import config from "../../config";
import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const TITLES = config.templateTitles;
const PAGE_SIZE = 25;

export default function(params) {
  let self = this;

  self.formatDateTime = fn.formatDateTime;

  new Binder(self)
    .obs("title", "New Template")
    .obs("active", false)
    .obs("guid", params.guid)
    .obs("createdOn", params.createdOn)
    .obs("templateType", params.templateType)
    .obs("templateTitle", TITLES[params.templateType] + ' templates')
    .obs("subject", "")
    .obs("documentContent", "")
    .obs("mimeType", "")
    .obs("showLoader", false)
    .obs("currentPage", 1)
    .obs("totalPages", 1)
    .obs("offsetBy", 0);

  self.previousPage = function(vm, event) {
    let page = self.currentPageObs() - 1;
    if (page >= 0) {
      self.showLoaderObs(true);
      self.offsetByObs(page * PAGE_SIZE);
      load();
    }
  };
  self.nextPage = function(vm, event) {
    let page = self.currentPageObs() + 1;
    if (page <= self.totalPagesObs() - 1) {
      self.showLoaderObs(true);
      self.offsetByObs(page * PAGE_SIZE);
      load();
    }
  };
  self.thisPage = function() {
    self.offsetByObs(self.currentPageObs() * PAGE_SIZE);
    load();
  };
  self.firstPage = function(vm, event) {
    self.showLoaderObs(true);
    self.offsetByObs(0);
    load();
  };
  self.lastPage = function(vm, event) {
    self.showLoaderObs(true);
    self.offsetByObs((self.totalPagesObs() - 1) * PAGE_SIZE);
    load();
  };

  tables.prepareTable(self, { 
    name: "template",
    plural: "templates",
    id: "template-history",
    refresh: load
  });

  self.publish = function(item, e) {
    utils.startHandler(self, e);

    serverService.publishTemplateRevision(params.guid, item.createdOn)
      .then(load)
      .then(utils.successHandler(self, e, "Revision published."))
      .catch(utils.failureHandler({ id: "template-history" }));
  };
  self.createHistoryLink = ko.computed(function() {
    return `/templates/${self.templateTypeObs()}/${self.guidObs()}/history`;
  });

  function publishState(template) {
    self.activeObs(template.publishedCreatedOn === params.createdOn);
    return template;
  }
  function updatePageState(response) {
    self.showLoaderObs(false);
    self.currentPageObs(Math.round(response.offsetBy / PAGE_SIZE));
    self.totalPagesObs(Math.ceil(response.total / PAGE_SIZE));
    response.items.forEach(item => item.active = item.createdOn === self.createdOnObs());
    return response;
  }

  function load() {
    serverService.getTemplate(params.guid)
      .then(publishState)
      .then(fn.handleObsUpdate(self.createdOnObs, "publishedCreatedOn"))
      .then(fn.handleObsUpdate(self.titleObs, "name"))
      .then(() => serverService.getTemplateRevisions(self.guidObs(), self.offsetByObs(), PAGE_SIZE))
      .then(updatePageState)
      .then(fn.handleObsUpdate(self.itemsObs, "items"));
  }
  load();
};
