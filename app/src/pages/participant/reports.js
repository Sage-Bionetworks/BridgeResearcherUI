import serverService from "../../services/server_service";
import ReportsBaseAccount from "../../accounts/reports_base_account";

export default class ParticipantReports extends ReportsBaseAccount {
  constructor(params) {
    super({
      ...params, 
      errorId: 'participant-reports',
      notFoundParams: {
        redirectTo: "participants",
        redirectMsg: "Participant not found",
      }
    });
  }
  loadAccount() {
    return serverService.getParticipant(this.userId);
  }
  deleteReport(item) {
    return serverService.deleteParticipantReport(item.identifier, this.userId);
  }
  reportURL(item) {
    return `/participants/${this.userId}/reports/${item.identifier}`;
  }
  loadReports() { 
    return serverService.getParticipantReports();
  }
}
