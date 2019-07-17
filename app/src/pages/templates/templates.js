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

  fn.copyProps(self, root, "isDeveloper", "isAdmin");
  self.criteriaLabel = criteriaUtils.label;
  self.defaultTemplatesObs = ko.observable({});
  self.study = null;
  self.templateTypeObs = ko.observable(params.templateType);
  self.titleObs = ko.observable(TITLES[params.templateType] + ' templates');

  tables.prepareTable(self, {
    name: "templates",
    type: "Template",
    refresh: load,
    delete: function(template) {
      return serverService.deleteTemplate(template.guid, false);
    },
    deletePermanently: function(template) {
      return serverService.deleteTemplate(template.guid, true);
    },
    undelete: function(template) {
      return serverService.updateTemplate(template);
    }
  });

  self.makeDefault = function(item, event) {
    self.study.defaultTemplates[item.templateType] = item.guid;

    utils.startHandler(self, event);
    serverService.saveStudy(self.study)
      .then(load)
      .then(utils.successHandler(self, event))
      .catch(utils.failureHandler());
  };

  self.isDefault = function(item) {
    return self.study.defaultTemplates[params.templateType] === item.guid;
  };

  function getTemplates() {
    return serverService.getTemplates(params.templateType, self.showDeletedObs());
  }
  function captureStudy(study) {
    self.study = study;
  }

  function load() {
    serverService.getStudy()
      .then(captureStudy)
      .then(getTemplates)
      .then(fn.handleSort("items", "name"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler());
  }
  load();
};
