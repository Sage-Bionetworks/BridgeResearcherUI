import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import sharedModuleUtils from "../../shared_module_utils";
import tables from "../../tables";
import utils from "../../utils";

const FAILURE_HANDLER = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found"
});
const LINK_COMPONENTS = {
  task: "tasks/",
  survey: "surveys/",
  compound: "compoundActivities/"
};

export default function activities(params) {
  let self = this;

  self.tempDedupMap = {};

  new Binder(self)
    .obs("userId", params.userId)
    .obs("status")
    .obs("title", "&#160;");

  tables.prepareTable(self, {
    name: "activitie",
    type: "Activity"
  });

  serverService.getParticipantName(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.statusObs(part.status);
    })
    .catch(FAILURE_HANDLER);

  self.linkMaker = function(ref) {
    let base = "#/participants/" + self.userIdObs() + "/activities/";
    return base + LINK_COMPONENTS[ref.type] + decodeURIComponent(ref.identifier);
  };

  function processPlans(response) {
    if (response.items.length) {
      response.items.forEach(processPlan);
    } else {
      self.itemsObs([]);
    }
    return response;
  }
  function processPlan(plan) {
    optionsService.getActivities(plan).forEach(processActivity);
  }
  function processActivity(activity) {
    let item = { type: activity.activityType };
    if (activity.task) {
      item.label = activity.task.identifier;
      item.identifier = activity.task.identifier;
    } else if (activity.survey) {
      item.label = sharedModuleUtils.getSurveyName(activity.survey.guid);
      item.identifier = activity.survey.guid;
    } else if (activity.compoundActivity) {
      item.label = activity.compoundActivity.taskIdentifier;
      item.identifier = activity.compoundActivity.taskIdentifier;
    }
    self.tempDedupMap[item.identifier] = item;
  }
  function sortPlans(response) {
    let array = Object.values(self.tempDedupMap);
    array.sort(function(a, b) {
      return a.label.localeCompare(b.label);
    });
    self.itemsObs(array);
  }

  self.deleteActivities = function(vm, event) {
    alerts.deleteConfirmation("Are you sure? You should never do this to an account in production.", () => {
      utils.startHandler(vm, event);
      serverService.deleteParticipantActivities(params.userId)
        .then(utils.successHandler(vm, event, "All activities for this participant have been deleted."))
        .catch(utils.failureHandler());
    });
  }

  sharedModuleUtils
    .loadNameMaps()
    .then(serverService.getSchedulePlans.bind(serverService))
    .then(processPlans)
    .then(sortPlans);
};
