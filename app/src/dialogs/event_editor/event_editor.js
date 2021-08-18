import { getEventIds } from "../../pages/schedule2/schedule2utils";
import Binder from "../../binder";
import root from "../../root";
import utils from "../../utils";
import { param } from "jquery";

// This is the v2 event editor, not the v1 editor, which is activity_event_editor.js
export default function(params) {
  let self = this;

  params.event = params.event || {
    'eventId': null, 
    'timestamp': new Date().toISOString(), 
    'clientTimeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  self.event = params.event;

  var binder = new Binder(self)
    .bind('eventId', params.event.eventId)
    .bind('timestamp', params.event.timestamp)
    .bind('clientTimeZone', params.event.clientTimeZone)
    .obs('title', 'Edit New Event')
    .obs('readOnly', params.event.eventId !== null)
    .obs('eventIdOptions[]', []);

  getEventIds(params.studyId).then(array => {
    self.eventIdOptionsObs(array);
  });
  self.save = function() {
    self.event = binder.persist(self.event);

    params.saveEvent(self.event)
      .then(() => root.closeDialog())
      .catch(utils.failureHandler({ id: 'event-editor' }))
  };
  self.cancel = root.closeDialog;
};
