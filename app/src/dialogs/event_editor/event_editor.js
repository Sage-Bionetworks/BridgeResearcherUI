import BridgeError from "../../bridge_error";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;
  self.readOnlyObs = ko.observable(!!params.event);

  params.event = params.event || { eventId: '', timestamp: new Date().toISOString()};
  let eventId = params.event.eventId.replace('custom:', '');
  self.eventIdOptionsObs = ko.observableArray([]);
  self.titleObs = ko.observable("Edit " + eventId);
  self.studyId = params.studyId;
  self.userId = params.userId;
  self.eventIdObs = ko.observable(eventId);
  self.timestampObs = ko.observable(params.event.timestamp);
  serverService.getApp().then(app => {
    Object.keys(app.automaticCustomEvents).forEach(
      key => self.eventIdOptionsObs.push({label: key, value: key}));
    Object.keys(app.customEvents).forEach(
      key => self.eventIdOptionsObs.push({label: key, value: key}));
    self.eventIdObs(eventId);
  });

  self.save = function() {
    // check that they haven't added custom:
    params.event.eventId = self.eventIdObs();
    params.event.timestamp = self.timestampObs();

    let error = new BridgeError();
    if (!params.event.eventId) {
      error.addError("eventId", "is required");
    }
    if (!params.event.timestamp) {
      error.addError("timestamp", "is required");
    }
    if (error.hasErrors()) {
      utils.failureHandler({ id: 'event-editor' })(error);
      return;
    }
    params.saveEvent(params.event).then(() => root.closeDialog());
  };
  self.cancel = root.closeDialog;
};
