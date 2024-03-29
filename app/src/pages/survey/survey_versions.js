import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const FAILURE_HANDLER = utils.failureHandler({
  redirectTo: "surveys",
  redirectMsg: "Survey not found.",
  id: 'survey-versions'
});

export default function surveyVersions(params) {
  let self = this;
  self.keys = params;

  self.formatDateTime = fn.formatDateTime;
  self.isAdmin = root.isAdmin;

  let binder = new Binder(self)
    .obs("guid", params.guid)
    .obs("createdOn", params.createdOn)
    .obs("published", false)
    .obs("items[]", [])
    .obs("selected", null)
    .obs("name");

  tables.prepareTable(self, {
    name: "survey version",
    type: "Survey Version",
    id: 'survey-versions',
    delete: (item) => serverService.deleteSurvey(item, false),
    deletePermanently: (item) => serverService.deleteSurvey(item, true),
    refresh: load,
    redirect: "/surveys"
  });

  // redirect, you just deleted the record you last loaded in the tabset.
  function redirectIfDeleteSelf(thisSurvey) {
    return function(response) {
      if (thisSurvey.createdOn === fn.formatDateTime(params.createdOn, "iso")) {
        document.location = "/surveys";
        return response;
      } else {
        return load();
      }
    };
  }

  self.deleteSurvey = function(survey, event) {
    alerts.deleteConfirmation("Are you sure you want to delete this survey version?", function() {
      utils.startHandler(self, event);
      serverService.deleteSurvey(survey)
        .then(load)
        .then(redirectIfDeleteSelf(survey))
        .then(utils.successHandler(self, event, "Survey version deleted."))
        .catch(utils.failureHandler({ id: 'survey-versions' }));
    });
  };
  self.publish = function(vm, event) {
    alerts.confirmation(
      "Are you sure you want to publish this survey version?\n\nOnce published, it can't be deleted.",
      function() {
        utils.startHandler(self, event);
        serverService.publishSurvey(vm.guid, vm.createdOn)
          .then(load)
          .then(utils.successHandler(vm, event, "Survey has been published."))
          .catch(utils.failureHandler({ id: 'survey-versions' }));
      }
    );
  };
  function getHistoryItems(response) {
    // Do not register an error here. Do not return the promise. We don't
    // care if Bluebird doesn't like it.
    serverService.getSurveyAllRevisions(params.guid).then(binder.update());
    return response;
  }
  function load() {
    // This is faster than it looks because of client-side caching
    return serverService.getSurvey(params.guid, params.createdOn)
      .then(binder.update())
      .then(getHistoryItems)
      .then(binder.update())
      .catch(FAILURE_HANDLER);
  }
  load();
};
