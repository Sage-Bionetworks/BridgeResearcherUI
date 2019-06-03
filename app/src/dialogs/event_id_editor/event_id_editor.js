import { serverService } from "../../services/server_service";
import { UNARY_EVENTS } from "../../schedule_formatter";
import Binder from "../../binder";
import fn from "../../functions";
import optionsService from "../../services/options_service";
import root from "../../root";
import utils from "../../utils";

function keyToUnary(key) {
  return { label: UNARY_EVENTS[key], value: key };
}
function keyToCustom(key) {
  return { label: "When “" + key + "” occurs", value: "custom:" + key };
}
function collectStudyEventKeys(eventKeys) {
  return function(study) {
    Object.keys(UNARY_EVENTS).forEach(key => eventKeys.push(keyToUnary(key)));
    Object.keys(study.automaticCustomEvents).forEach(key => eventKeys.push(keyToCustom(key)));
    study.activityEventKeys.forEach(key => eventKeys.push(keyToCustom(key)));
    return study;
  };
}
function collectActivityEventKeys(eventKeys) {
  return function(activities) {
    activities.forEach(activity => {
      eventKeys.push({
        label: "When activity “" + activity.label + "” is finished",
        value: "activity:" + activity.value + ":finished"
      });
    });
    return eventKeys;
  };
}

/**
 * This editor no longer allows you to edit survey or question triggered events, although these
 * are supported by the event system. These events are not generated when surveys are answered
 * and submitted to Bridge, so there's no point in exposing a scheduling UI for these at this time.
 */
export default function(params) {
  let self = this;

  new Binder(self)
    .obs("activity")
    .obs("index")
    .obs("allEventKeys[]")
    .obs("selectedEventKeys[]");

  fn.copyProps(self, params, "clearEventIdFunc", "eventIdObs");
  self.activityLabel = utils.makeOptionLabelFinder(self.allEventKeysObs);
  self.closeDialog = root.closeDialog;

  self.addEventKey = function(vm, event) {
    var key = self.activityObs();
    if (key && !self.selectedEventKeysObs().includes(key)) {
      if (UNARY_EVENTS[key]) {
        // Only allow one enrollment-related event.
        Object.keys(UNARY_EVENTS).forEach(oneKey => {
          self.removeEventKey(oneKey);
        });
        self.selectedEventKeysObs.push(key);
      } else {
        self.selectedEventKeysObs.unshift(key);
      }
    }
  };
  self.removeEventKey = function(key, event) {
    self.selectedEventKeysObs.remove(key);
  };
  self.saveAndCloseDialog = function() {
    var eventIdString = self.selectedEventKeysObs().join(",");
    self.eventIdObs(eventIdString);
    root.closeDialog();
  };
  self.clearAndCloseDialog = function(vm, event) {
    self.clearEventIdFunc(vm, event);
    root.closeDialog();
  };

  function initEditor() {
    var eventIdString = self.eventIdObs();
    if (eventIdString) {
      eventIdString.split(",").forEach(eventId => {
        self.selectedEventKeysObs.push(eventId.trim());
      });
    } else {
      self.selectedEventKeysObs.push("enrollment");
    }
  }

  let eventKeys = [];
  serverService
    .getStudy()
    .then(collectStudyEventKeys(eventKeys))
    .then(optionsService.getActivityOptions)
    .then(collectActivityEventKeys(eventKeys))
    .then(self.allEventKeysObs)
    .then(initEditor);
};
