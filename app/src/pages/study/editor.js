import Binder from "../../binder";
import config from "../../config";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Study not found.",
  redirectTo: "studies",
  transient: false,
  id: 'study'
});

export default function(params) {
  let self = this;
  self.study = {};

  fn.copyProps(self, fn, "formatDateTime");
  fn.copyProps(self, root, 'isDevRole');
  fn.copyProps(self, config, 'phasesOpts');

  function toDateString(value) {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      value = new Date(value);
    }
    return value.toISOString().split('T')[0];
  }

  let binder = new Binder(self)
    .obs("title", "New Study")
    .obs("isNew", params.studyId === "new")
    .obs("createdOn")
    .obs("modifiedOn")
    .obs('schedules[]')
    .obs('decisionType[]', [
      {label: 'Approved', value: 'approved'},
      {label: 'Exempted', value: 'exempt'}
    ])
    .bind("version")
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
    .bind("disease")
    .bind("studyDesignType")
    .bind("identifier", params.studyId === "new" ? null : params.studyId);

  self.formatPhase = function(phase) {
    if (phase) {
      return config.phasesOpts.filter(opt => opt.value === phase)[0].label;
    }
    return '';
  }

  function loadSchedules() {
    return serverService.getSchedules(0, 100).then(response => {
      self.schedulesObs.pushAll(response.items.map(sch => {
        return {label: sch.name, value: sch.guid};
      }));
    });
  }
  function load() {
    return params.studyId === "new" ? 
      Promise.resolve({}) : 
      serverService.getStudy(params.studyId).then(fn.handleObsUpdate(self.titleObs, "name"));
  }
  function createStudy(vm, event) {
      serverService.createStudy(self.study)
        .then(utils.successHandler(vm, event, "Study has been saved."))
        .then(() => document.location = `#/studies/${self.identifierObs()}/general`)
        .catch(failureHandler);
  }
  function updateStudy(vm, event) {
      serverService.updateStudy(self.study)
        .then(fn.handleStaticObsUpdate(self.isNewObs, false))
        .then(fn.handleObsUpdate(self.versionObs, "version"))
        .then(fn.handleStaticObsUpdate(self.modifiedOnObs, new Date()))
        .then(updateModifiedOn)
        .then(fn.returning(self.study))
        .then(fn.handleObsUpdate(self.titleObs, "name"))
        .then(utils.successHandler(vm, event, "Study has been saved."))
        .catch(failureHandler);

  }
  function updateModifiedOn(response) {
    params.studyId = self.identifierObs();
    self.modifiedOnObs(response.modifiedOn);
    return response;
  }

  self.save = function(vm, event) {
    self.study = binder.persist(self.study);

    utils.startHandler(vm, event);
    if (self.isNewObs()) {
      createStudy(vm, event);
    } else {
      updateStudy(vm, event);
    }
  };

  loadSchedules()
    .then(load)
    .then(binder.assign("study"))
    .then(binder.update())
    .catch(failureHandler);
};
