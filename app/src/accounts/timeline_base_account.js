import BaseAccount from "./base_account";
import serverService from "../services/server_service";

export default class TimelineBaseAccount extends BaseAccount {
  constructor(params) {
    super({...params, errorId: 'participant-timeline'});
    this.binder
      .obs("json")
      .obs('entries[]');

    this.assessments = {};
    this.sessions = {};

    this.getAccount()
      .then(res => this.account = res)
      .then(() => serverService.getStudyParticipantTimeline(params.studyId, params.userId))
      .then(res => this.init(res));
  }
  init(res) {
    this.jsonObs(JSON.stringify(res, null, 2));
    res.assessments.forEach(asmt => this.assessments[asmt.key] = asmt);
    res.sessions.forEach(sess => this.sessions[sess.refGuid] = sess);
    this.entriesObs.pushAll(res.schedule);
  }
  days(startDay, endDay) {
    return (startDay === endDay) ? `Day ${startDay}` : `Days ${startDay}—${endDay}`;
  }
  eventId(guid) {
    return this.sessions[guid].startEventId;
  }
  performanceOrder(guid) {
    let po = this.sessions[guid].performanceOrder;
    return po.substring(0,1).toUpperCase() + po.substring(1);
  }
  line1($data) {
    return this.days($data.startDay, $data.endDay) + ' after “' + this.eventId($data.guid) + '”';
  }
  line2($data) {
    return 'Start time: ' + $data.startTime + ', expiring after ' + $data.expiration;
  }
  line3(item) {
    return `${item.label} [${item.appId}-${item.identifier}]`;
    /* This is the data we could be displaying: 
    {"key":"eab1a821eab1a821","guid":"ts2Fc9M6O-0fiE5xkfpPax_t","appId":"shared","identifier":"asmt3","revision":1,"label":"This is a test","minutesToComplete":3,"colorScheme":{"background":"#ff33ff","type":"ColorScheme"},"type":"AssessmentInfo"}
    */
  }
  asmt($data) {
    return this.line3(this.assessments[$data.refKey]);
  }
}