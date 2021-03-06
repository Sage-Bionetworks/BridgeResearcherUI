import serverService from "../../services/server_service";
import ReportBaseAccount from '../../accounts/report_base_account';
import root from "../../root";

export default class StudyParticipantReport extends ReportBaseAccount {
  constructor(params) {
    super({ 
      ...params,
      errorId: 'studyparticipant-report',
      notFoundParams: {
        redirectTo: `#/studies/${params.studyId}/participants`,
        redirectMsg: "Participant not found"
      }
    });
    serverService.getStudy(params.studyId).then(res => this.navStudyNameObs(res.name));
  }
  loadAccount() {
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  deleteReport(item) {
    return serverService.deleteParticipantReportRecord(this.userId, this.identifier, item.date);
  }
  linkMaker() {
    return `#/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/reports`;
  }
}