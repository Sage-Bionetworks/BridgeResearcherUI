import ConsentsBaseAccount from "../../accounts/consents_base_account";
import fn from "../../functions";
import serverService from "../../services/server_service";

export default class StudyParticipantConsents extends ConsentsBaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-consents',
      notFoundParams: {
        redirectTo: `studies/${params.studyId}/participants`,
        redirectMsg: 'Participant not found'
      }
    });
    this.studyId = params.studyId
    serverService.getStudy(this.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    });
  }
  getParticipantName() {
    return serverService.getStudyParticipantName(this.studyId, this.userId);
  }
  resendConsentAgreement(subpopGuid) {
    return serverService.resendStudyParticipantConsentAgreement(this.studyId, this.userId, subpopGuid);
  }
  withdrawParticipantFromApp(reason) {
    throw new Error('withdrawParticipantFromApp not implemented');
  }
  withdrawParticipantFromSubpopulation(subpopGuid, reason) {
    return serverService.withdrawStudyParticipantFromStudy(this.studyId, this.userId, subpopGuid, reason);
  }
  getParticipant() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  linkToDocument(data) {
    let query = fn.queryString({
      userId: this.userId,
      studyId: this.studyId,
      index: data.subpopulationGuidIndex,
      guid: data.subpopulationGuid,
      host: this.session.host
    });
    return "/consent/consent.html" + query;
  }
}