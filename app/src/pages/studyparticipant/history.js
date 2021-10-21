import BaseAccount from "../../accounts/base_account";
import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default class StudyParticipantActivityHistory extends BaseAccount {
  constructor(params) {
    super({ 
      ...params, 
      errorId: 'studyparticipant-history',
      notFoundParams: {
        redirectTo: `studies/${params.studyId}/participants`,
        redirectMsg: 'Participant not found'
      }
    });
    fn.copyProps(this, fn, "formatDateTime");
    this.eventId = params.eventId;

    serverService.getStudy(this.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    });
    tables.prepareTable(this, { 
      name: "activity event",
      id: this.failureParams.id
    });

    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;
    ko.postbox.subscribe('spe-refresh', (query) => this.load(query));
  }
  load(query) {
    this.query = query;
    return this.getAccount()
      .then(() => serverService.getStudyParticipantActivityEventHistory(
        this.studyId, this.userId, this.eventId, query.offsetBy, query.pageSize))
      .then(this.postLoadPagerFunc)
      .then(res => this.itemsObs(res.items))
      .catch((e) => { // ick
        this.itemsObs([]);
        utils.failureHandler({id: 'studyparticipant-history'})(e);
      });
  }
  loadAccount() { 
    return serverService.getStudyParticipant(this.studyId, this.userId);
  }
  link(postfix) {
    return `/studies/${this.studyId}/participants/${encodeURIComponent(this.userId)}/${postfix}`;
  }
  formatEventId(eventId) {
    return eventId.replace(/^custom\:/, '');
  }
}