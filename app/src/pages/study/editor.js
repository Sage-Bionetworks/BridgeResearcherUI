import config from "../../config";
import fn from "../../functions";
import serverService from "../../services/server_service";
import BaseStudy from "./base_study";

function toDateString(value) {
  if (!value) {
    return;
  }
  if (typeof value === 'string') {
    value = new Date(value);
  }
  return value.toISOString().split('T')[0];
}

export default class StudyEditor extends BaseStudy {
  constructor(params) {
    super(params, 'study', 'general');

    fn.copyProps(this, config, 'phasesOpts');

    this.binder
      .obs('schedules[]')
      .obs('decisionType[]', [
        {label: 'Approved', value: 'approved'},
        {label: 'Exempted', value: 'exempt'}
      ])
      .bind("name")
      .bind("details")
      .bind("phase")
      .bind("institutionId")
      .bind("irbName")
      .bind("irbProtocolId")
      .bind("irbDecisionOn", null, null, toDateString)
      .bind("irbExpiresOn", null, null, toDateString)
      .bind("irbDecisionType")
      .bind("scheduleGuid", null)
      .bind("diseases[]")
      .bind("studyDesignTypes[]")
      .bind("keywords");

    this.loadSchedules()
      .then(this.load.bind(this))
      .then(this.binder.assign("study"))
      .then(this.binder.update())
      .catch(this.failureHandler);
  }
  formatDateTime(date) {
    return (date) ? fn.formatDateTime(date) : '';
  }
  loadSchedules() {
    return serverService.getSchedules(0, 100).then(response => {
      this.schedulesObs.pushAll(response.items.map(sch => {
        return {label: sch.name, value: sch.guid};
      }));
    });
  }
  formatPhase(phase) {
    if (phase) {
      return config.phasesOpts.filter(opt => opt.value === phase)[0].label;
    }
    return '';
  }

}