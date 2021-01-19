import EnrollmentsBaseAccount from "../../accounts/enrollments_base_account";
import serverService from "../../services/server_service";

export default class ParticipantEnrollments extends EnrollmentsBaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'participant-enrollments',
      notFoundParams: {
        redirectTo: 'participants', 
        redirectMsg: 'Participant not found'
      }
    });
  }
  loadAccount() { 
    return serverService.getParticipant(this.userId);
  }
  loadEnrollments() {
    return serverService.getParticipantEnrollments(this.userId);
  }
}
