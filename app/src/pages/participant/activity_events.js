import Binder from "../../binder";
import fn from "../../functions";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const failureHandler = utils.failureHandler({
  redirectTo: "events",
  redirectMsg: "Activity events not found",
  id: 'participant-activity-events'
});

export default function activityEvents(params) {
  let self = this;

  fn.copyProps(self, root, "isResearcher");

  new Binder(self)
    .obs("userId", params.userId)
    .obs("title", "&#160;")
    .obs("status")
    .obs("dataGroups[]")
    .obs("items[]");

  tables.prepareTable(self, {
    name: "activity event",
    type: "Activity Event",
    id: 'participant-activity-events'
  });

  self.formatDateTime = fn.formatDateTime;

  self.activityLabel = function(item) {
    if (item.eventId.indexOf("activity:") > -1) {
      var guid = item.eventId.split(":")[1];
      return activitiesMap[guid];
    }
    return "";
  };

  serverService.getParticipant(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.statusObs(part.status);
      self.dataGroupsObs(part.dataGroups)
    })
    .catch(failureHandler);

  serverService.getParticipantActivityEvents(params.userId)
    .then(fn.handleSort("items", "timestamp", true))
    .then(fn.handleObsUpdate(self.itemsObs, "items"))
    .catch(failureHandler);

  var activitiesMap = {};

  optionsService.getActivityOptions()
    .then(function(array) {
      array.forEach((option) => activitiesMap[option.value] = option.label);
    })
    .then(() => serverService.getParticipantActivityEvents(params.userId))
    .then(fn.handleSort("items", "timestamp", true))
    .then(fn.handleObsUpdate(self.itemsObs, "items"))
    .catch(failureHandler);
};
