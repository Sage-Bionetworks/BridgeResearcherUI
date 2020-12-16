import serverService from "../../services/server_service";
import RequestInfoBaseAccount from "../../accounts/request_info_base_account";

export default class RequestInfoMember extends RequestInfoBaseAccount {
  constructor(params) {
    super({ ...params, errorId: 'mem-request-info' });
  }
  loadAccount() {
    return serverService.getAccount(this.userId);
  }
  requestInfo() {
    return serverService.getAccountRequestInfo(this.userId);
  }
}