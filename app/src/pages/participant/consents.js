import ConsentsBaseAccount from "../../accounts/consents_base_account";
import fn from "../../functions";
import serverService from "../../services/server_service";

export default class ParticipantConsents extends ConsentsBaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'participant-consents',
      notFoundParams: {
        redirectTo: `participants`,
        redirectMsg: 'Participant not found'
      }
    });
  }
  getParticipantName() {
    return serverService.getParticipantName(this.userId);
  }
  resendConsentAgreement(subpopGuid) {
    return serverService.resendConsentAgreement(this.userId, subpopGuid);
  }
  withdrawParticipantFromApp(reason) {
    return serverService.withdrawParticipantFromApp(this.userId, reason);
  }
  withdrawParticipantFromSubpopulation(subpopGuid, reason) {
    return serverService.withdrawParticipantFromSubpopulation(this.userId, subpopGuid, reason)
  }
  getParticipant() { 
    return serverService.getParticipant(this.userId)
  }
  linkToDocument(data) {
    let query = fn.queryString({
      userId: this.userIdObs(),
      index: data.subpopulationGuidIndex,
      guid: data.subpopulationGuid,
      host: this.session.host
    });
    return "/consent/consent.html" + query;
  }
}