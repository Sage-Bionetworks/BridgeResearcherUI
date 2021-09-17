import GeneralBaseAccount from "../../accounts/general_base_account";
import serverService from "../../services/server_service";

export default class ParticipantGeneral extends GeneralBaseAccount {
  constructor(params) {
    super({
      ...params, 
      errorId: 'participant-general',
      notFoundParams: {
        redirectTo: 'participants', 
        redirectMsg: 'Participant not found'
      }
    });
  }
  loadAccount() {
    return serverService.getParticipant(this.userId);
  }
  createAccount() {
    return serverService.createParticipant(this.account)
      .then(res => window.location = `#/participants/${res.identifier}/general`);
  }
  installLink() {
    return serverService.sendInstallLink(this.userId);
  }
  updateAccount() { 
    return serverService.updateParticipant(this.account);
  }
  deleteAccount() { 
    return serverService.deleteTestUser(this.userId)
      .then(() => window.location = `#/participants`, 100);
  }
  signOutAccount() {
    return serverService.signOutUser(this.userId);
  }
  requestAccountResetPassword() {
    return serverService.requestResetPasswordUser(this.userId);
  }
  resendAccountEmailVerification() {
    return serverService.resendEmailVerification(this.userId);
  }
  resendAccountPhoneVerification() {
    return serverService.resendPhoneVerification(this.userId);
  }
}
