import GeneralBaseAccount from "../../accounts/general_base_account";
import serverService from "../../services/server_service";

export default class GeneralMember extends GeneralBaseAccount {
  constructor(params) {
    super({ ...params, errorId: 'mem-general' });
  }
  loadAccount() {
    return serverService.getAccount(this.userId);
  }
  createAccount() {
    return serverService.createAccount(this.account)
      .then(res => window.location = `#/organizations/${this.orgId}/members/${res.identifier}/general`);
  }
  updateAccount() { 
    return serverService.updateAccount(this.userId, this.account);
  }
  deleteAccount() { 
    return serverService.deleteTestUser(this.userId);
  }
  signOutAccount() {
    return serverService.signOutAccount(this.userId);
  }
  requestAccountResetPassword() {
    return serverService.requestAccountResetPassword(this.userId);
  }
  resendAccountEmailVerification() {
    return serverService.resendAccountEmailVerification(this.userId);
  }
  resendAccountPhoneVerification() {
    return serverService.resendAccountPhoneVerification(this.userId);
  }
  getAccountRequestInfo() { 
    return serverService.getAccountRequestInfo(this.userId);
  }
}
