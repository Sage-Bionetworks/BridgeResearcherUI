import Binder from "../../binder";
import config from "../../config";
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import serverService from "../../services/server_service";
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

  self.formatDateTime = fn.formatDateTime;
  
  let binder = new Binder(self)
    .obs("isNew", params.guid === "new")
    .obs("guid", params.guid)
    .obs("templateType", params.templateType)
    .obs("templateTitle", TITLES[params.templateType] + ' templates')
    .obs("title", "New Template")
    .bind("name")
    .bind("description")
    .bind("criteria")
    .bind("createdOn")
    .bind("modifiedOn");

  let titleUpdated = fn.handleObsUpdate(self.titleObs, "name");

  function redirect(keys) {
    document.location = `#/templates/${self.templateTypeObs()}/${keys.guid}`;
    return keys;
  }

  function saveTemplate() {
    return self.template.guid ? 
      serverService.updateTemplate(self.template) : 
      serverService.createTemplate(self.template).then(redirect);
  }

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
