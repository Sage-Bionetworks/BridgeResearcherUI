import BaseAccount from "./base_account";
import fn from "../functions";
import serverService from "../services/server_service";
import utils from "../utils";

export default class TimelineBaseAccount extends BaseAccount {
  constructor(params) {
    super(params);
    this.binder
      .obs("json")
      .obs('entries[]');

    this.assessments = {};
    this.sessions = {};

    this.getAccount()
      .then(res => this.account = res)
      .then(() => serverService.getStudyParticipantTimeline(params.studyId, params.userId))
      .then(res => this.init(res))
      .catch(utils.failureHandler(this.failureParams));
  }
  init(res) {
    res.assessments.forEach(asmt => this.assessments[asmt.key] = asmt);
    res.sessions.forEach(sess => this.sessions[sess.guid] = sess);
    this.entriesObs.pushAll(res.schedule);
  }
  sessionInfo(sch) {
    let session = this.sessions[sch.refGuid];
    let eventId = session.startEventId.replace('custom:', '');
    let exp = (sch.expiration) ? ` for ${fn.formatDuration(sch.expiration)}` : '';
    let days = (sch.startDay === sch.endDay) ? `Day ${sch.startDay}` : `Days ${sch.startDay}—${sch.endDay}`;
    return `<h4>${session.label}</h4>` +
      `<p>${days} after “${eventId}” start @ ${sch.startTime}${exp}<br>` +
      `Instance GUID: <a href="${this.searchLink(sch)}">${sch.instanceGuid}</a><br>` +
      `Order: ${session.performanceOrder}</p>`;
  }
  asmtInfo(asmt) {
    let assessment = this.assessments[asmt.refKey];
    let shared = (assessment.appId === 'shared') ? ' in shared' : '';
    return `<b>${assessment.label}</b> (${assessment.identifier}${shared})<br>` +
      `Instance GUID: <a href="${this.searchLink(asmt)}">${asmt.instanceGuid}</a>`;
  }
}