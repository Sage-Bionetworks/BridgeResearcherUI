import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;

  self.formatDateTime = (v) => v ? fn.formatDateTime(v) : '—';
  self.formatDeclined = (v)=> v ? 'Declined' : '';

  self.save = (vm, event) => {
    utils.startHandler(self, event)

    var records = [];
    self.assessmentsObs().forEach(asmt => addAssessment(records, asmt));
    serverService.updateStudyParticipantAdherenceRecords(params.studyId, params.userId, {records})
      .then(utils.successHandler(vm, event))
      .then(() => params.closeDialog())
      .catch(utils.failureHandler({id: 'session-editor'}));
  };
  self.cancel = () => {
    root.closeDialog();
  };

  function addAssessment(array, record) {
    if (record.startedOnObs()) {
      record.startedOn = record.startedOnObs();
    }
    if (record.finishedOnObs()) {
      record.finishedOn = record.finishedOnObs();
    }
    if (!record.clientTimeZone) {
      record.clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    record.declined = record.declinedObs();
    record.eventTimestamp = params.eventTimestamp;
    array.push(record);
  }

  new Binder(self)
    .bind('sessionLabel')
    .bind('sessionStartedOn')
    .bind('sessionFinishedOn')
    .bind('sessionDeclined')
    .obs('clientTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)
    .bind('assessments[]');

  serverService.getStudyParticipantTimeline(params.studyId, params.userId).then(timeline => {
    let asmtMap = {};
    let sessMap = {};

    timeline.sessions.forEach(sess => sessMap[sess.guid] = sess);
    timeline.assessments.forEach(asmt => asmtMap[asmt.key] = asmt);

    for (let i=0; i < timeline.schedule.length; i++) {
      let item = timeline.schedule[i];
      if (item.instanceGuid === params.instanceGuid) {
        self.sessionLabelObs(sessMap[item.refGuid].label);
        item.assessments.forEach(asmt => {
          asmt.label = asmtMap[asmt.refKey].label;
          asmt.instanceGuidObs = ko.observable(asmt.instanceGuid);
          asmt.startedOnObs = ko.observable();
          asmt.finishedOnObs = ko.observable();
          asmt.declinedObs = ko.observable(false);
          self.assessmentsObs.push(asmt);
        })
      }
    }
  }).then(() => {
    var guids = self.assessmentsObs().map(asmt => asmt.instanceGuidObs());
    guids.push(params.instanceGuid);

    let search = {
      instanceGuids: guids,
      eventTimestamps: {[params.eventId]: params.eventTimestamp}
    };
    serverService.getStudyParticipantAdherenceRecords(params.studyId, params.userId, search)
      .then(response => {
        let arr = self.assessmentsObs();
        for (let i=0; i < response.items.length; i++) {
          let record = response.items[i];
          if (params.instanceGuid === record.instanceGuid) {
            self.sessionStartedOnObs(record.startedOn);
            self.sessionFinishedOnObs(record.finishedOn);
            self.sessionDeclinedObs(record.declined);
          }
          for (let j=0; j < arr.length; j++) {
            let asmt = arr[j];
            if (asmt.instanceGuidObs() == record.instanceGuid) {
              asmt.startedOnObs(record.startedOn);
              asmt.finishedOnObs(record.finishedOn);
              asmt.declinedObs(record.declined);
            }
          }
        }
      });
  });

};