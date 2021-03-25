import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

const UPDATE_TYPES = [
  {label: "Immutable", value: "immutable"},
  {label: "Mutable", value: "mutable"},
  {label: "Future timestamps only", value: "future_only"}
];

export default function() {
  let self = this;
  self.app = null;

  self.customEventsObs = ko.observableArray([]);

  self.save = function(vm, event) {
    let map = {};
    self.customEventsObs().map(event => {
      if (event.eventIdObs()) {
        map[event.eventIdObs()] = event.updateTypeObs();
      }
    });
    self.app.customEvents = map;

    utils.startHandler(vm, event);
    serverService.saveApp(self.app)
      .then(utils.successHandler(vm, event, "Custom events saved."))
      .catch(utils.failureHandler({ id: 'custom-events' }));
  };
  self.addCustomEvent = function() {
    self.customEventsObs.push({
      eventIdObs: ko.observable(),
      updateTypeObs: ko.observable(),
      allUpdateTypesObs: ko.observableArray(UPDATE_TYPES)
    });
  };
  serverService.getApp().then(function(app) {
    self.app = app;
    let customEvents = Object.keys(app.customEvents).sort().map(eventId => {
      return {
        eventIdObs: ko.observable(eventId),
        updateTypeObs: ko.observable(app.customEvents[eventId]),
        allUpdateTypesObs: ko.observableArray(UPDATE_TYPES)
      };
    })
    self.customEventsObs.pushAll(customEvents);
  });
};
