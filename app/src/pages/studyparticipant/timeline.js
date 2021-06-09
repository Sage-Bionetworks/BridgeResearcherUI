import TimelineBaseAccount from "../../accounts/timeline_base_account";
import serverService from "../../services/server_service";

export default class StudyParticipantTimeline extends TimelineBaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-timeline',
      notFoundParams: {
        redirectTo: `studies/${params.studyId}/participants`,
        redirectMsg: 'Participant not found'
      }
    });
    serverService.getStudy(this.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    });
  }
  searchLink(item) {
    return `?instanceGuid=${item.instanceGuid}#/studies/${this.studyId}/participants/${this.userId}/schedule/adherencesearch`
  }
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  link(postfix) {
    return `#/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/${postfix}`;
  }
}