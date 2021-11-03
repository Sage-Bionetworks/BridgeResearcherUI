import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import ReportBaseAccount from '../../accounts/report_base_account';
import serverService from "../../services/server_service";

export default class StudyParticipantReport extends ReportBaseAccount {
  constructor(params) {
    super({ 
      ...params,
      errorId: 'studyparticipant-report',
      notFoundParams: {
        redirectTo: `/studies/${params.studyId}/participants`,
        redirectMsg: "Participant not found"
      }
    });
    serverService.getStudy(params.studyId).then(res => this.navStudyNameObs(res.name));
  }
  loadAccount() {
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  deleteReport(item) {
    return serverService.deleteStudyParticipantReportRecord(this.studyId, this.userId, this.identifier, item.date);
  }
  getParticipantReportIndex() {
    return serverService.getStudyParticipantReportIndex(this.studyId, this.identifierObs());
  }
  getReports() {
    let startDate = fn.formatDate(this.startDateObs(), 'iso');
    let endDate = fn.formatDate(this.endDateObs(), 'iso');
    return serverService.getStudyParticipantReport(this.studyId, this.userId, this.identifier, startDate, endDate)
      .then(fn.handleMap("items", jsonFormatter.mapItem))
      .then(fn.handleSort("items", "date", true))
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
  }
  linkMaker() {
    return `/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/reports`;
  }
}