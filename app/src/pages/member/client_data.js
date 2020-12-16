import ClientDataBaseAccount from "../../accounts/client_data_base_account";
import serverService from "../../services/server_service";

export default class ClientDataMember extends ClientDataBaseAccount {
  constructor(params) {
    super({...params, errorId: 'mem-client-data'});
    this.failureParams.redirectTo = "organizations/" + params.orgId + "/members";
    this.failureParams.redirectMsg = "Organization member not found";
  }
  loadAccount() { 
    return serverService.getAccount(this.userId);
  }
  updateAccount() {
    return serverService.updateAccount(this.account.id, this.account)
  }
}
