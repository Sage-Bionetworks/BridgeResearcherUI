import kind_of from "kind-of";
import Binder from "../../binder";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;

  self.save = (vm, event) => {
    utils.startHandler(self, event)

    var records = [];
    addSession(records, self);
    self.assessmentsObs().forEach(asmt => addAssessment(records, asmt));
    serverService.updateStudyParticipantAdherenceRecords(params.studyId, params.userId, {records})
      .then(utils.successHandler(vm, event))
      .then(() => params.closeDialog())
      .catch(utils.failureHandler({id: 'session-editor'}));
  };
  self.cancel = () => {
    root.closeDialog();
  };

  function addSession(array, record) {
    let obj = { instanceGuid: record.sessionInstanceGuidObs(), eventTimestamp: params.eventTimestamp };
    if (record.sessionStartedOnObs()) {
      obj.startedOn = record.sessionStartedOnObs();
    }
    if (record.sessionFinishedOnObs()) {
      obj.finishedOn = record.sessionFinishedOnObs();
    }
    if (record.sessionDeclinedObs()) {
      obj.declined = true;
    }
    array.push(obj);
  }
  function addAssessment(array, record) {
    let obj = { instanceGuid: record.instanceGuidObs(), eventTimestamp: params.eventTimestamp };
    
    if (record.startedOnObs()) {
      obj.startedOn = record.startedOnObs();
    }
    if (record.finishedOnObs()) {
      obj.finishedOn = record.finishedOnObs();
    }
    obj.declined = record.declinedObs();
    obj.clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    array.push(obj);
  }

  new Binder(self)
    .bind('sessionInstanceGuid', params.instanceGuid)
    .bind('sessionLabel')
    .bind('sessionStartedOn')
    .bind('sessionFinishedOn')
    .bind('sessionDeclined')
    .obs('clientTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)
    .bind('assessments[]');

  self.clientTimeZoneObs()

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
          self.assessmentsObs.push({
            label: asmtMap[asmt.refKey].label,
            instanceGuidObs: ko.observable(asmt.instanceGuid),
            startedOnObs: ko.observable(),
            finishedOnObs: ko.observable(),
            declinedObs: ko.observable(false)
          });
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
          if (self.sessionInstanceGuidObs() === record.instanceGuid) {
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