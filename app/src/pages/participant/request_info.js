import RequestInfoBaseAccount from "../../accounts/request_info_base_account";

export default class RequestInfoParticipant extends RequestInfoBaseAccount {
  constructor(params) {
    super({
      ...params, 
      errorId: 'participant-request-info',
      notFoundParams: {
        redirectTo: 'participants', 
        redirectMsg: 'Participant not found'
      }
    });
  }
}
