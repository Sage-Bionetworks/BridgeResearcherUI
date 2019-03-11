import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import fn from "../../functions";
import tables from "../../tables";
import utils from "../../utils";
import optionsService from "../../services/options_service";

const failureHandler = utils.failureHandler({
  redirectTo: "events",
  redirectMsg: "Activity events not found"
});

module.exports = function(params) {
  let self = this;

  new Binder(self)
    .obs("userId", params.userId)
    .obs("title", "&#160;")
    .obs("status")
    .obs("items[]");

  tables.prepareTable(self, {
    name: "activity event",
    type: "Activity Event"
  });

  self.formatDateTime = fn.formatDateTime;

  self.activityLabel = function(item) {
    if (item.eventId.indexOf("activity:") > -1) {
      var guid = item.eventId.split(":")[1];
      return activitiesMap[guid];
    }
    return "";
  };

  serverService
    .getParticipantName(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.statusObs(part.status);
    })
    .catch(failureHandler);

  serverService
    .getParticipantActivityEvents(params.userId)
    .then(fn.handleSort("items", "timestamp", true))
    .then(fn.handleObsUpdate(self.itemsObs, "items"))
    .catch(failureHandler);

  var activitiesMap = {};

  optionsService
    .getActivityOptions()
    .then(function(array) {
      array.forEach(function(option) {
        activitiesMap[option.value] = option.label;
      });
    })
    .then(function() {
      return serverService.getParticipantActivityEvents(params.userId);
    })
    .then(fn.handleSort("items", "timestamp", true))
    .then(fn.handleObsUpdate(self.itemsObs, "items"))
    .catch(failureHandler);
};
