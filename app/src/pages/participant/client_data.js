import ClientDataBaseAccount from "../../accounts/client_data_base_account";
import serverService from "../../services/server_service";

export default class ParticipantClientData extends ClientDataBaseAccount {
  constructor(params) {
    super({
      ...params, 
      errorId: 'participant-client-data',
      notFoundParams: {
        redirectTo: 'participants', 
        redirectMsg: 'Participant not found'
      }
    });
  }
  loadAccount() { 
    return serverService.getParticipant(this.userId);
  }
  updateAccount() {
    return serverService.updateParticipant(this.account);
  }
}
