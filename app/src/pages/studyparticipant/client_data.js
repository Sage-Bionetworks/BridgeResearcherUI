import serverService from "../../services/server_service";
import ClientDataBaseAccount from "../../accounts/client_data_base_account";

export default class ClientDataParticipant extends ClientDataBaseAccount {
  constructor(params) {
    super({
      ...params, 
      errorId: 'studyparticipant-client-data',
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
  updateAccount() {
    return serverService.updateStudyParticipant(this.studyId, this.account);
  }
}
