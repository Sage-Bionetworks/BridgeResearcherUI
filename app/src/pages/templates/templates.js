import config from '../../config';
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import ko from 'knockout';
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const TITLES = config.templateTitles;

export default function(params) {
  let self = this;
  self.query = {}; // capture this for when the *parent* wants to refresh the page

  fn.copyProps(self, root, "isDeveloper", "isAdmin");
  self.criteriaLabel = criteriaUtils.label;
  self.defaultTemplatesObs = ko.observable({});
  self.app = null;
  self.templateTypeObs = ko.observable(params.templateType);
  self.titleObs = ko.observable(TITLES[params.templateType] + ' templates');

  // capture post-processing of the pager control
  self.postLoadPagerFunc = fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;

  tables.prepareTable(self, {
    name: "templates",
    type: "Template",
    id: 'templates',
    refresh: () => load(self.query),
    delete: (template) => serverService.deleteTemplate(template.guid, false),
    deletePermanently: (template)  => serverService.deleteTemplate(template.guid, true),
    undelete: (template) => serverService.updateTemplate(template)
  });

  self.makeDefault = function(item, event) {
    self.app.defaultTemplates[item.templateType] = item.guid;

    utils.startHandler(self, event);
    serverService.saveApp(self.app)
      .then(load)
      .then(utils.successHandler(self, event))
      .catch(utils.failureHandler({ id: 'templates' }));
  };

  self.isDefault = function(item) {
    return self.app.defaultTemplates[params.templateType] === item.guid;
  };

  function getTemplates() {
    return serverService.getTemplates(self.query);
  }
  function captureApp(app) {
    self.app = app;
  }

  function load(query) {
    query.includeDeleted = self.showDeletedObs();
    query.type = params.templateType;
    self.query = query;
    serverService.getApp()
      .then(captureApp)
      .then(getTemplates)
      .then(fn.handleSort("items", "name"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'templates' }));
  }
  ko.postbox.subscribe('t-refresh', load);
};
