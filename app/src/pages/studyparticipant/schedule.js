import alerts from "../../widgets/alerts";
import BaseAccount from "../../accounts/base_account";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default class StudyParticipantEnrollments extends BaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-schedule',
      notFoundParams: {
        redirectTo: `studies/${params.studyId}/participants`,
        redirectMsg: 'Participant not found'
      }
    });
    fn.copyProps(this, fn, "formatDateTime");

    serverService.getStudy(this.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    });
    tables.prepareTable(this, { 
      name: "activity events",
      id: this.failureParams.id
    });    
    this.getAccount()
      .then(() => serverService.getStudyParticipantActivityEvents(this.studyId, this.userId))
      .then(res => this.itemsObs(res.items));
  }
  formatDaysSince(timestamp) {
    let start = new Date(timestamp);
    let end = new Date();
    let days = (end - start) / 1000 / 60 / 60 / 24;
    let result = Math.ceil(days - (end.getTimezoneOffset() - start.getTimezoneOffset()) / (60 * 24));
    return (result > 0) ? result : '';
  }
  formatEventId(eventId) {
    return eventId.replace(/^custom\:/, '');
  }
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  link(postfix) {
    return `#/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/${postfix}`;
  }
  deleteEvent(event, browserEvent) {
    let self = ko.contextFor(browserEvent.target).$component;
    alerts.deleteConfirmation("Are you sure?", () => {
      utils.startHandler(self, event);
      let eventId = event.eventId.replace(/^custom\:/, '');
      serverService.deleteStudyParticipantActivityEvent(self.studyId, self.userId, eventId)
        .then(utils.successHandler(self, event, "Event deleted."))
        .then(() => serverService.getStudyParticipantActivityEvents(self.studyId, self.userId))
        .then(res => self.itemsObs(res.items))
        .catch(utils.failureHandler({ id: 'studyparticipant-schedule' }));
    });
  }
  editEvent(event, browserEvent) {
    let self = ko.contextFor(browserEvent.target).$component;
    root.openDialog('event_editor', {
      event: ((event.timestamp) ? event : null),
      studyId: self.studyId,
      userId: self.userId,
      saveEvent: self.saveEvent.bind(self)
    });
  }
  createEvent(event) {
    root.openDialog('event_editor', {
      event: ((event.timestamp) ? event : null),
      studyId: this.studyId,
      userId: this.userId,
      saveEvent: this.saveEvent.bind(this)
    });
  }
  saveEvent(event) {
    return serverService.createStudyParticipantActivityEvent(this.studyId, this.userId, event)
      .then(() => serverService.getStudyParticipantActivityEvents(this.studyId, this.userId))
      .then(res => this.itemsObs(res.items));
  }
}