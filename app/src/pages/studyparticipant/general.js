import GeneralBaseAccount from "../../accounts/general_base_account";
import root from "../../root";
import serverService from "../../services/server_service";

export default class GeneralParticipant extends GeneralBaseAccount {
  constructor(params) {
    super({
      ...params,
      errorId: 'studyparticipant-general',
      notFoundParams: {
        redirectTo: `#/studies/${params.studyId}/participants`,
        redirectMsg: "Participant not found"
      }
    });
    serverService.getStudy(params.studyId).then(res => this.navStudyNameObs(res.name));
  }
  installLink() {
    return serverService.sendStudyParticipantInstallLink(this.studyId, this.userId);
  }
  loadAccount() {
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  createAccount() {
    return serverService.createStudyParticipant(this.studyId, this.account)
      .then(res => window.location = `#/studies/${this.studyId}/participants/${res.identifier}/general`);
  }
  updateAccount(vm, event) { 
    return serverService.updateStudyParticipant(this.studyId, this.account);
  }
  deleteAccount() {
    return serverService.deleteStudyParticipant(this.studyId, this.userId)
        .then(() => window.location = `#/studies/${this.studyId}/participants`);
  }
  requestAccountResetPassword() {
    return serverService.requestStudyParticipantResetPassword(this.studyId, this.userId);
  }
  resendAccountEmailVerification() {
    return serverService.resendStudyParticipantEmailVerification(this.studyId, this.userId);
  }
  resendAccountPhoneVerification() {
    return serverService.resendStudyParticipantPhoneVerification(this.studyId, this.userId);
  }
  signOutAccount() {
    return serverService.signOutUser(this.userId);
  }
  signOutUser() {
    root.openDialog("sign_out_user", { studyId: this.studyId, userId: this.userId });
  }
}
