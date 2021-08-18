import alerts from "../../widgets/alerts";
import config from "../../config";
import fn from "../../functions";
import serverService from "../../services/server_service";
import BaseStudy from "./base_study";
import utils from "../../utils";

const DECISION_TYPES = [
  {label: 'Approved', value: 'approved'},
  {label: 'Exempted', value: 'exempt'}
];
const ALLOWED_TRANSITIONS = {
  'legacy': ['design'],
  'design': ['recruitment', 'withdrawn'],
  'recruitment': ['in_flight', 'withdrawn'],
  'in_flight': ['recruitment', 'analysis', 'withdrawn'],
  'analysis': ['recruitment', 'in_flight', 'completed', 'withdrawn'],
  'completed': [],
  'withdrawn': [],
};
const PATHS_TO_STATES = {
  'design': 'design',
  'recruit': 'recruitment',
  'conduct': 'in_flight',
  'analyze': 'analysis',
  'complete': 'completed',
  'withdraw': 'withdrawn'
}

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
    this.decisionType = DECISION_TYPES;

    this.binder
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

    this.load()
      .then(this.binder.assign("study"))
      .then(this.binder.update())
      .catch(this.failureHandler);
  }
  formatDateTime(date) {
    return (date) ? fn.formatDateTime(date) : '';
  }
  formatPhase(phase) {
    if (phase) {
      return config.phasesOpts.filter(opt => opt.value === phase)[0].label;
    }
    return '<none>';
  }
  changeTo(phase) {
    return (vm, event) => {
      alerts.confirmation("Are you sure? This cannot always be undone.", () => {
        return serverService.transitionTo(this.studyId, phase)
          .then(study => this.versionObs(study.version))
          .then(() => this.phaseObs(PATHS_TO_STATES[phase]))
          .then(utils.successHandler(vm, event, "Study updated."))
          .catch(utils.failureHandler({transient: true, id: 'study', redirect: false}));
      });
    };
  }
  isPhaseButtonVisible() { 
    return !['completed', 'withdrawn'].includes(this.phaseObs());
  }
  isPhaseVisible(phase) {
    return (ALLOWED_TRANSITIONS[this.phaseObs()] || []).includes(phase);
  }
}