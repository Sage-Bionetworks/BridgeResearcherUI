import Binder from "../../binder";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;

  params.event = params.event || 
    {'eventId': null, 'timestamp': new Date().toISOString(), 'clientTimeZone': null};
  self.event = params.event;

  var binder = new Binder(self)
    .bind('eventId', null, (t) => (t) ? t.replace('custom:','') : null, (t) => 'custom:'+t)
    .bind('timestamp', null)
    .bind('clientTimeZone', null)
    .obs('title', 'Edit New Event')
    .obs('readOnly', !!params.event.eventId)
    .obs('eventIdOptions[]');

  self.eventIdObs.subscribe(newValue => {
    if (newValue) {
      self.titleObs('Edit ' + newValue);
    }
  });

  serverService.getApp().then(app => {
    Object.keys(app.customEvents).forEach(
      key => self.eventIdOptionsObs.push({label: key, value: key}));
  }).then(() => binder.update()(params.event));

  self.save = function() {
    self.event = binder.persist(self.event);

    params.saveEvent(self.event)
      .then(() => root.closeDialog())
      .catch(utils.failureHandler({ id: 'event-editor' }))
  };
  self.cancel = root.closeDialog;
};
