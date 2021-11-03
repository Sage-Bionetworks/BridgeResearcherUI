import alerts from "../../widgets/alerts";
import EnrollmentsBaseAccount from "../../accounts/enrollments_base_account";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default class StudyParticipantEnrollments extends EnrollmentsBaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-enrollments',
      notFoundParams: {
        redirectTo: `studies/${params.studyId}/participants`,
        redirectMsg: 'Participant not found'
      }
    });
    serverService.getStudy(this.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    });
  }
  note(item, event) {
    // knockout destroys the "this" binding. We can get it back with some magic
    let self = ko.contextFor(event.target).$component;
    alerts.prompt("Note:", (note) => {
      let en = {note: note, withdrawalNote: item.withdrawalNote};
      utils.startHandler(self, event);
      serverService.updateEnrollment(item.studyId, item.participant.identifier, en)
        .then(() => self.getEnrollments())
        .catch(utils.failureHandler(this.failureParams));
    }, item.note);
  }
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  loadEnrollments() {
    return serverService.getStudyParticipantEnrollments(this.studyId, this.userId);
  }
}
