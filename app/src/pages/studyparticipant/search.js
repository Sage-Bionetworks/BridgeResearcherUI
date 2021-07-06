import BaseAccount from "../../accounts/base_account";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const PAGE_KEY = 'ad-refresh';

function arrayToString(a) {
  return a ? a.join(', ') : null;
}
function stringToArray(s) {
  return (s && typeof s === 'string') ? s.split(/,\s?/) : null;
}

export default class StudyParticipantAdherence extends BaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-adherencesearch',
      notFoundParams: {
        redirectTo: `studies/${params.studyId}/participants`,
        redirectMsg: 'Participant not found'
      }
    });
    this.assessments = {};
    this.sessions = {};
    this.schedules = {};
    this.search = this.search.bind(this);

    let ig = root.queryParams.instanceGuid ? root.queryParams.instanceGuid : null;

    this.binder = new Binder(this)
      .bind('instanceGuids', ig, arrayToString, stringToArray)
      .bind('assessmentIds', null, arrayToString, stringToArray)
      .bind('sessionGuids', null, arrayToString, stringToArray)
      .bind('timeWindowGuids', null, arrayToString, stringToArray)
      .bind('adherenceRecordType', null)
      .bind('includeRepeats', true)
      .bind('currentTimestampsOnly', true)
      .bind('startTime')
      .bind('endTime')
      .bind('sortOrder', 'desc')
      .obs("showLoader", false);

    tables.prepareTable(this, { 
      name: "adherence record",
      id: 'studyparticipant-adherencesearch',
      refresh: () => ko.postbox.publish(PAGE_KEY, 0)
    });

    serverService.getStudy(this.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    });
    this.getAccount()
      .then(() => this.load())
      .then(() => ko.postbox.publish(PAGE_KEY, 0));
  }
  load() {
    this.itemsObs([]);
    return serverService.getStudyParticipantTimeline(this.studyId, this.userId)
      .then(res => this.init(res))
      .then(() => ko.postbox.publish(PAGE_KEY, 0))
      .catch(utils.failureHandler(this.failureParams));
  }
  doFormSearch(vm, event) {
    utils.startHandler(vm, event);
    ko.postbox.publish(PAGE_KEY, 0);
  }
  search(offsetBy) {
    let query = this.binder.persist({
      'instanceGuids': [],
      'assessmentIds': [],
      'sessionGuids': [],
      'timeWindowGuids': [],
      'adherenceRecordType': null,
      'includeRepeats': false,
      'currentTimestampsOnly': false,
      'startTime': null,
      'endTime': null,
      'sortOrder': null
    });
    query.offsetBy = offsetBy;
    if (query.adherenceRecordType === '') {
      delete query.adherenceRecordType;
    }
    return serverService.getStudyParticipantAdherenceRecords(this.studyId, this.userId, query)
      .then(res => {
        res.items.forEach(i => i.clientDataObs = ko.observable(i.clientData))
        return res;
      })
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(utils.successHandler())
      .catch(utils.failureHandler(this.failureParams));
  }
  clear(vm, event) {
    utils.startHandler(vm, event);
    this.instanceGuidsObs([]);
    this.assessmentIdsObs([]);
    this.sessionGuidsObs([]);
    this.timeWindowGuidsObs([]);
    this.adherenceRecordTypeObs(null);
    this.includeRepeatsObs(false);
    this.currentTimestampsOnlyObs(false);
    this.startTimeObs(null);
    this.endTimeObs(null);
    this.sortOrderObs('desc');
    ko.postbox.publish(PAGE_KEY, 0);
  }
  init(res) {
    res.assessments.forEach(asmt => this.assessments[asmt.key] = asmt);
    res.sessions.forEach(sess => this.sessions[sess.guid] = sess);
    res.schedule.forEach(sch => {
      sch.session = this.sessions[sch.refGuid];
      this.schedules[sch.instanceGuid] = sch;
      sch.assessments.forEach(asmt => {
        asmt.assessment = this.assessments[asmt.refKey];
        asmt.session = sch.session;
        asmt.sessionInstanceGuid = sch.instanceGuid;
        this.schedules[asmt.instanceGuid] = asmt;
      });
    });
  }
  saveClientData(item, data) {
    item.clientData = data;
    item.clientDataObs(data);
    root.closeDialog();
    return serverService.updateStudyParticipantAdherenceRecords(
      this.studyId, this.userId, {"records":[item]});
  }
  editClientData(item, event) {
    event.preventDefault();
    let vm = ko.contextFor(event.target).$parent;
    root.openDialog("json_editor", {
      saveFunc: vm.saveClientData.bind(vm),
      closeFunc: root.closeDialog,
      item: item,
      data: item.clientData
    });
    return false;
  }
  formatRecord(item) {
    let entry = this.schedules[item.instanceGuid];
    return (entry.assessment) ? entry.assessment.label :entry.session.label;
  }
  formatAsmtId(item) {
    let entry = this.schedules[item.instanceGuid];
    return (entry.assessment) ? entry.assessment.identifier : entry.session.guid;
  }
  formatDays(item) {
    let entry = this.schedules[item.instanceGuid];
    if (entry.assessment) {
      entry = this.schedules[entry.sessionInstanceGuid];
    }
    let startDay = entry.startDay;
    let endDay = entry.endDay;
    if (startDay === endDay) {
      return `Day ${startDay}, ${entry.startTime} for ${fn.formatDuration(entry.expiration)}`;
    }
    return `Days ${startDay}—${endDay}, ${entry.startTime} for ${fn.formatDuration(entry.expiration)}`;
  }
  formatStream(item) {
    let entry = this.schedules[item.instanceGuid];
    return `${entry.session.startEventId} @ ${item.eventTimestamp}`;
  }
  startedOn(item) {
    return (item.startedOn) ? fn.formatDateTime(item.startedOn) : '';
  }
  finishedOn(item) {
    return (item.finishedOn) ? fn.formatDateTime(item.finishedOn) : '';
  }
  clientData(item) {
    return item.clientData  ? JSON.stringify(item.clientData) : '';
  }
  clientTimeZone(item) {
    return item.clientTimeZone || '';
  }
  declined(item) {
    return (item.declined) ? '<i class="ui green check icon"><i>' : '';
  }
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  link(postfix) {
    return `#/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/${postfix}`;
  }
}