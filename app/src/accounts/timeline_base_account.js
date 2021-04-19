import BaseAccount from "./base_account";
import serverService from "../services/server_service";

export default class TimelineBaseAccount extends BaseAccount {
  constructor(params) {
    super({...params, errorId: 'participant-timeline'});
    this.binder.obs("json");
    this.getAccount()
      .then(res => this.account = res)
      .then(() => serverService.getStudyParticipantTimeline(params.studyId, params.userId))
      .then(res => this.jsonObs(res));
  }
  loadAccount() {
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
}