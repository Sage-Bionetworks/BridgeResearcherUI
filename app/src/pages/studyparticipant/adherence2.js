import BaseAccount from "../../accounts/base_account";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default class StudyParticipantAdherence extends BaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-adherence2',
      notFoundParams: {
        redirectTo: `studies/${params.studyId}/participants`,
        redirectMsg: 'Participant not found'
      }
    });
    this.reportObs = ko.observable();
    this.weeksObs = ko.observableArray([]);
    this.timeZoneObs = ko.observable('');
    this.adherenceObs = ko.observable('');
    this.unsetEventIdsObs = ko.observable('');
    this.unscheduledSessionsObs = ko.observable('');

    serverService.getStudy(this.studyId).then((response) => {
        this.navStudyNameObs(response.name);
    }).then(() => this.getAccount())
      .then(() => this.load());
    ko.postbox.subscribe('load-adherence', () => this.load());
  }
  path() {
    return `adherence/study`;
  }

  formatProgress() {
    if (this.reportObs()) {
      switch(this.reportObs().progression) {
        case 'unstarted':
          return '— Unstarted —';
        case 'in_progress':
          return '— In Progress —';
        case 'done':
          return '— Done —';
        case 'no_schedule':
          return '— No Schedule —';
      }
      return '—';
    }
  }
  load() {
    return serverService.getStudyParticipantAdherenceReport(this.studyId, this.userId, this.path())
      .then(report => {
        this.timeZoneObs(report.clientTimeZone);
        if (typeof report.adherencePercent !== 'undefined') {
          this.adherenceObs(report.adherencePercent + '%');
        } else {
          this.adherenceObs('—');
        }
        this.unsetEventIdsObs(report.unsetEventIds.join(', '));
        this.unscheduledSessionsObs(report.unscheduledSessions.join(', '));
        this.reportObs(report);
        this.weeksObs(report.weeks);
      })
      .catch(utils.failureHandler({ id: 'studyparticipant-adherence2' }));
  }
  loadAccount() {
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  preview(report) {
    let func = null;
    if (report === 'ps') {
      func = () => serverService.getStudyParticipantSchedule(
        this.studyId, this.userId);
    } else {
      func = () => serverService.getStudyParticipantAdherenceReport(
        this.studyId, this.userId, 'adherence/'+report);
    }
    root.openDialog('preview_dialog', {
      title: `Preview adherence ${report.replace('/', ' ')} report`, 
      supplier: func
    });
  }
}