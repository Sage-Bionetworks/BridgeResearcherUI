import BaseAccount from "./base_account";
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
  days(startDay, endDay) {
    return (startDay === endDay) ? `Day ${startDay}` : `Days ${startDay}—${endDay}`;
  }
  eventId(sch) {
    return this.sessions[sch.refGuid].startEventId.replace("custom:", "");
  }
  line1(sch) {
    return this.days(sch.startDay, sch.endDay) + ' after “' + this.eventId(sch) + '”';
  }
  line2(sch) {
    let str = 'Start time: ' + sch.startTime;
    if (sch.expiration) {
      str += ', expiring after ' + sch.expiration;
    }
    let po = this.sessions[sch.refGuid].performanceOrder;
    str += ', ' + po.substring(0,1).toUpperCase() + po.substring(1);
    return str;
  }
  /* This is the data we could be displaying: 
  {"key":"eab1a821eab1a821","guid":"ts2Fc9M6O-0fiE5xkfpPax_t","appId":"shared","identifier":"asmt3","revision":1,"label":"This is a test","minutesToComplete":3,"colorScheme":{"background":"#ff33ff","type":"ColorScheme"},"type":"AssessmentInfo"}
  */
  asmtLabel(asmt) {
    return this.assessments[asmt.refKey].label;
  }
  asmtId(asmt) {
    var item = this.assessments[asmt.refKey];
    return `${item.appId}-${item.identifier}`;
  }
}