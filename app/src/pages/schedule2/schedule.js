import { getEventIds } from "./schedule2utils";
import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  var self = this;
  self.studyId = params.studyId;
  self.study = null;
  self.schedule = {};

  fn.copyProps(self, fn, 'formatDateTime');

  var binder = new Binder(self)
    .obs('identifier')
    .obs('title')
    .obs('isStudyNew', false)
    .obs('phase')
    
    .obs('isNew')
    .obs('createdOn')
    .obs('modifiedOn')
    .bind('name')
    .bind('guid')
    .bind('duration')
    .bind('version')
    .bind('sessions[]', [], null, Binder.persistArrayWithBinder)
    .obs('eventIds[]');

  self.generateId = function(fieldName) {
    return fieldName;
  }
  self.preview = function(vm, event) {
    utils.clearErrors();
    root.openDialog("preview_timeline", { studyId: params.studyId, scheduleGuid: self.schedule.guid });
  };
  self.save = function(vm, event) {
    self.schedule = binder.persist(self.schedule);

    utils.startHandler(vm, event)
    if (self.isNewObs()) {
      serverService.createOrUpdateStudySchedule(params.studyId, self.schedule)
        .then(afterSave)
        .then(utils.successHandler(vm, event, "Schedule created."))
        .then((sch) => document.location = `#/studies/${params.studyId}/schedule`)
        .catch(utils.failureHandler({ id: 'schedule' }))
    } else {
      serverService.createOrUpdateStudySchedule(params.studyId, self.schedule)
        .then(afterSave)
        .then(utils.successHandler(vm, event, "Schedule saved."))
        .catch(utils.failureHandler({ id: 'schedule' }))
    }
  }

  self.addSession = function(vm, event) {
    self.sessionsObs.push({
      'name': 'Session #' + (self.sessionsObs().length+1),
      'performanceOrder': 'sequential',
      'timeWindows': [{'startTime': '08:00'}]
    });
  }

  function afterSave(schedule) {
    self.versionObs(schedule.version);
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

  serverService.getStudy(params.studyId).then(study => {
    self.study = study;
    self.titleObs(study.name);
    self.identifierObs(study.identifier);
    self.phaseObs(study.phase);
  });
  getEventIds(params.studyId).then(array => self.eventIdsObs(array)).then(() => {
    if (self.study.scheduleGuid) {
      serverService.getStudySchedule(params.studyId)
        .then(binder.assign('schedule'))
        .then(afterSave)
        .then(binder.update())
        .catch(utils.failureHandler({
          redirectTo: `#/studies/${params.studyId}/general`,
          redirectMsg: 'Schedule not found'
        }));
    } else {
      self.isNewObs(true);
    }
  });
};
