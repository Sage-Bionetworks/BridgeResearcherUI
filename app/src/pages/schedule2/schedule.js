import { getEventIds } from "./schedule2utils";
import Binder from "../../binder";
import fn from "../../functions";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  var self = this;
  self.schedule = {};

  fn.copyProps(self, fn, 'formatDateTime');

  var binder = new Binder(self)
    .obs('title')
    .obs('isNew', params.guid === 'new')
    .obs('createdOn')
    .obs('modifiedOn')
    .bind('name')
    .bind('guid', params.guid === 'new' ? null : params.guid)
    .bind('duration')
    .bind('durationStartEventId')
    .bind('version')
    .bind('sessions[]', [], null, Binder.persistArrayWithBinder)
    .obs('eventIds[]');

  self.generateId = function(fieldName) {
    return fieldName;
  }
  self.save = function(vm, event) {
    self.schedule = binder.persist(self.schedule);

    utils.startHandler(vm, event)
    if (self.isNewObs()) {
      serverService.createSchedule(self.schedule)
        .then(afterSave)
        .then(utils.successHandler(vm, event, "Schedule created."))
        .then((sch) => document.location = '#/schedules/' + sch.guid)
        .catch(utils.failureHandler({ id: 'schedule' }))
    } else {
      serverService.updateSchedule(self.schedule)
        .then(afterSave)
        .then(utils.successHandler(vm, event, "Schedule saved."))
        .catch(utils.failureHandler({ id: 'schedule' }))
    }
  }

  self.addSession = function(vm, event) {
    self.sessionsObs.push({
      'name': 'Session #' + (self.sessionsObs().length+1),
      'startEventId': self.durationStartEventIdObs()
    });
  }

  function afterSave(schedule) {
    self.versionObs(schedule.version);
    self.titleObs(schedule.name);
    self.guidObs(schedule.guid);
    self.isNewObs(false);
    self.modifiedOnObs(schedule.modifiedOn);
    walkAndUpdateGuids(self.schedule, schedule);
    return schedule;
  }
  function walkAndUpdateGuids(schedule, savedSchedule) {
    for (var i=0; i < savedSchedule.sessions.length; i++) {
      var session = savedSchedule.sessions[i];
      schedule.sessions[i].guid = session.guid;
      if (schedule.sessions[i].binder) {
        schedule.sessions[i].binder.fields.guid.observable(session.guid);
      }
      for (var j=0; j < session.assessments.length; j++) {
        var ref = session.assessments[j];
        var existingRef = schedule.sessions[i].assessments[j];
        existingRef.guid = ref.guid;
        if (existingRef.binder) {
          existingRef.binder.fields.guid.observable(ref.guid);
        }
      }
      for (var j=0; j < session.timeWindows.length; j++) {
        var window = session.timeWindows[j];
        var existingWindow = schedule.sessions[i].timeWindows[j];
        existingWindow.guid = window.guid;
        if (existingWindow.binder) {
          existingWindow.binder.fields.guid.observable(window.guid);
        }
      }
    }
  }

  getEventIds().then(array => self.eventIdsObs(array)).then(() => {
    if (params.guid !== 'new') {
      serverService.getSchedule(params.guid)
        .then(binder.assign('schedule'))
        .then(afterSave)
        .then(binder.update())
        .catch(utils.failureHandler({
          redirectTo: `schedules`,
          redirectMsg: 'Schedule not found'
        }));
    }
  });
};
