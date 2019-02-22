import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import Promise from "bluebird";
import root from "../../root";
import utils from "../../utils";

module.exports = function(params) {
  let self = this;
  params = params || {};

  self.event = {
    eventId: params.eventId || "",
    timestamp: params.timestamp || new Date()
  };

  var binder = new Binder(self)
    .bind("eventId", self.event.eventId)
    .bind("timestamp", self.event.timestamp, null, function(d) {
      return d.toISOString();
    });

  self.closeDialog = root.closeDialog;

  self.save = function(vm, e) {
    self.event = binder.persist(self.event);
    self.event.eventKey = self.event.eventId;

    utils.startHandler(vm, e);
    serverService
      .createParticipantActivityEvents(params.userId, self.event)
      .then(params.reload)
      .then(root.closeDialog)
      .then(utils.successHandler(vm, e))
      .catch(utils.failureHandler());
  };
};
