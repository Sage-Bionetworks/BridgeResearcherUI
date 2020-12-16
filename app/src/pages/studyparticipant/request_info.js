import RequestInfoBaseAccount from "../../accounts/request_info_base_account";
import serverService from "../../services/server_service";

export default class RequestInfoParticipant extends RequestInfoBaseAccount {
  constructor(params) {
    super({ ...params, id: 'studyparticipant-request-info' });
    serverService.getStudy(params.studyId).then(res => this.navStudyNameObs(res.name));
  }
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  requestInfo() {
    return serverService.getStudyParticipantRequestInfo(this.studyId, this.userId);
  }
}
