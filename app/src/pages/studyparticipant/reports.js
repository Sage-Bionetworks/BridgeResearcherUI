import serverService from "../../services/server_service";
import ReportBaseAccount from "../../accounts/reports_base_account";

export default class StudyParticipantReport extends ReportBaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-reports',
      notFoundParams: {
        redirectTo: `#/studies/${params.studyId}/participants`,
        redirectMsg: "Participant not found"
      }
    });
    serverService.getStudy(params.studyId).then(res => this.navStudyNameObs(res.name));
  }
  canEdit() {
    return super.canEdit();
  }
  loadAccount() {
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  deleteReport(item) {
    return serverService.deleteParticipantReport(item.identifier, this.userId);
  }
  reportURL(item) {
    return `#/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/reports/${item.identifier}`
  }
  loadReports() { 
    return serverService.getParticipantReports();
  }
}
