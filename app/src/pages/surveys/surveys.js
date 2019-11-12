import fn from "../../functions";
import ko from "knockout";
import Promise from "bluebird";
import root from "../../root";
import serverService from "../../services/server_service";
import sharedModuleUtils from "../../shared_module_utils";
import tables from "../../tables";
import utils from "../../utils";

const SURVEY_FIELDS_TO_DELETE = ["guid", "version", "createdOn", "modifiedOn", "published", "deleted"];

function addScheduleField(survey) {
  survey.schedulePlanObs = ko.observableArray([]);
}
function collectGuids(object, array) {
  Object.keys(object).forEach(function(prop) {
    if (prop === "survey") {
      array.push(object[prop].guid);
    } else if (typeof object[prop] === "object") {
      collectGuids(object[prop], array);
    }
  });
  return array;
}
function annotateSurveys(surveys, plans) {
  plans.forEach(function(plan) {
    let allPlanGuids = collectGuids(plan, []);
    surveys.forEach(function(survey) {
      if (allPlanGuids.indexOf(survey.guid) > -1) {
        survey.schedulePlanObs.push({ label: plan.label, guid: plan.guid });
      }
    });
  });
}

export default function surveys() {
  let self = this;

  fn.copyProps(self, fn, "formatDateTime");
  fn.copyProps(self, root, "isDeveloper", "isAdmin");
  fn.copyProps(self, sharedModuleUtils, "formatModuleLink", "moduleHTML");

  tables.prepareTable(self, {
    name: "survey",
    type: "Survey",
    refresh: load,
    delete: function(item) {
      return serverService.getSurveyAllRevisions(item.guid).then(response => {
        return Promise.map(response.items, item => {
          return serverService.deleteSurvey(item, false);
        });
      });
    },
    deletePermanently: function(item) {
      return serverService.getSurveyAllRevisions(item.guid, true).then(response => {
        return Promise.map(response.items, item => {
          return serverService.deleteSurvey(item, true);
        });
      });
    },
    undelete: function(item) {
      // We need to pick up the existing questions or we'll wipe out the elements
      return serverService
        .getSurvey(item.guid, item.createdOn)
        .then(item => {
          item.deleted = false;
          return item;
        })
        .then(serverService.updateSurvey.bind(serverService));
    }
  });

  self.formatSchedules = function(survey) {
    return survey
      .schedulePlanObs()
      .map(function(obj) {
        return obj.label;
      })
      .join(", ");
  };
  self.copySurveys = function(vm, event) {
    let copyables = self.itemsObs().filter(tables.hasBeenChecked);
    let confirmMsg = copyables.length > 1 ? "Surveys have been copied." : "Survey has been copied.";

    utils.startHandler(vm, event);
    Promise.mapSeries(copyables, function(survey) {
      return serverService.getSurvey(survey.guid, survey.createdOn).then(function(fullSurvey) {
        fullSurvey.name += " (Copy)";
        fullSurvey.identifier += "-copy";
        SURVEY_FIELDS_TO_DELETE.forEach(function(field) {
          delete fullSurvey[field];
        });
        fullSurvey.elements.forEach(function(element) {
          delete element.guid;
        });
        return serverService.createSurvey(fullSurvey);
      });
    }).then(load)
    .then(utils.successHandler(vm, event, confirmMsg))
    .catch(utils.failureHandler({ id: 'surveys' }));
  };
  self.openModuleBrowser = function() {
    root.openDialog("module_browser", {
      type: "survey",
      closeModuleBrowser: self.closeModuleBrowser
    });
  };
  self.closeModuleBrowser = function() {
    root.closeDialog();
    load();
  };
  function getSchedulePlans(response) {
    if (response.items.length) {
      var surveys = response.items;
      return serverService.getSchedulePlans().then(function(res) {
        annotateSurveys(surveys, res.items);
      });
    }
  }
  function loadSurveys() {
    return serverService.getSurveys(self.showDeletedObs());
  }
  function load() {
    return sharedModuleUtils.loadNameMaps()
      .then(loadSurveys)
      .then(fn.handleSort("items", "name"))
      .then(fn.handleForEach("items", addScheduleField))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(getSchedulePlans)
      .catch(utils.failureHandler({ id: 'surveys' }));
  }
  load();
};
