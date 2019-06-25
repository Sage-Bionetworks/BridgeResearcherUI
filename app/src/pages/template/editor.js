import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import config from "../../config";
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import ko from "knockout";
import utils from "../../utils";

const TITLES = config.templateTitles;

const failureHandler = utils.failureHandler({
  redirectMsg: "Template not found.",
  redirectTo: "templates",
  transient: false
});

function newTemplate(templateType) {
  return { name: "", description: "", templateType: templateType, criteria: criteriaUtils.newCriteria() };
}

export default function(params) {
  let self = this;

  let binder = new Binder(self)
    .obs("isNew", params.guid === "new")
    .obs("guid", params.guid)
    .obs("templateType", params.templateType)
    .obs("templateTitle", TITLES[params.templateType] + ' templates')
    .obs("title", "New Template")
    .obs("createdOn")
    .obs("publishedConsentCreatedOn")
    .bind("name")
    .bind("description")
    .bind("criteria");

  let titleUpdated = fn.handleObsUpdate(self.titleObs, "name");

  function saveTemplate() {
    return self.template.guid ? 
      serverService.updateTemplate(self.template) : 
      serverService.createTemplate(self.template);
  }

  self.activeObs = ko.computed(function() {
    return self.createdOnObs() === "recent" || self.createdOnObs() === self.publishedConsentCreatedOnObs();
  });
  self.createHistoryLink = ko.computed(function() {
    return `#/templates/${self.templateTypeObs()}/${self.guidObs()}/revisions/${self.createdOnObs()}`;
    // return "#/templates/" + self.guidObs() + "/editor/" + self.createdOnObs() + "/history";
  });

  self.save = function(vm, event) {
    self.template = binder.persist(self.template);
    utils.startHandler(vm, event);

    saveTemplate()
      .then(fn.handleStaticObsUpdate(self.isNewObs, false))
      .then(fn.handleObsUpdate(self.guidObs, "guid"))
      .then(fn.handleCopyProps(params, "guid"))
      .then(fn.returning(self.template))
      .then(titleUpdated)
      .then(utils.successHandler(vm, event, "Template has been saved."))
      .catch(failureHandler);
  };

  if (params.guid === "new") {
    Promise.resolve(newTemplate(params.templateType))
      .then(binder.assign("template"))
      .then(binder.update())
      .catch(failureHandler);
  } else {
    serverService
      .getTemplate(params.guid)
      .then(binder.assign("template"))
      .then(binder.update())
      .then(titleUpdated)
      .catch(failureHandler);
  }
};
