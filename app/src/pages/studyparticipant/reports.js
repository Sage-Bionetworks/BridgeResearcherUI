import serverService from "../../services/server_service";
import ReportsBaseAccount from "../../accounts/reports_base_account";

export default class StudyParticipantReport extends ReportsBaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-reports',
      notFoundParams: {
        redirectTo: `/studies/${params.studyId}/participants`,
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
  deleteReportIndex(item) {
    return serverService.deleteStudyParticipantReportIndex(this.studyId, item.identifier);
  }
  reportURL(item) {
    return `/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/reports/${item.identifier}`
  }
  loadReports() { 
    return serverService.getStudyParticipantReports(this.studyId);
  }
}
