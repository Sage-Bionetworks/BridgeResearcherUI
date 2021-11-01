import serverService from "../../services/server_service";
import ReportBaseAccount from '../../accounts/report_base_account';

export default class ParticipantReport extends ReportBaseAccount {
  constructor(params) {
    super({ 
      ...params,
      errorId: 'participant-report',
      notFoundParams: {
        redirectTo: "participants",
        redirectMsg: "Participant not found"
      }
    });
  }
  loadAccount() {
    return serverService.getParticipant(this.userId);
  }
  deleteReport(item) {
    return serverService.deleteParticipantReportRecord(this.userId, this.identifier, item.date);
  }
  linkMaker() {
    return `/participants/${this.userId}/reports`; 
  }
}