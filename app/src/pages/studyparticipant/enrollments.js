import EnrollmentsBaseAccount from "../../accounts/enrollments_base_account";
import serverService from "../../services/server_service";

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
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  loadEnrollments() {
    return serverService.getStudyParticipantEnrollments(this.studyId, this.userId);
  }
}
