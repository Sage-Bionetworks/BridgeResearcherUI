import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";
import options_service from "../../services/options_service";
import BaseStudy from "./base_study";

const cssClassNameForStatus = {
  disabled: "negative",
  unverified: "warning",
  verified: ""
};
function assignClassForStatus(participant) {
  // does not have sharing scope so we can't show it on summary page.
  return cssClassNameForStatus[participant.status];
}
function getId(studyId, userId) {
  return serverService.getStudyParticipant(studyId, userId);
}
function getHealthCode(studyId, userId) {
  return serverService.getStudyParticipant(studyId, "healthCode:" + userId);
}
function getExternalId(studyId, userId) {
  return serverService.getStudyParticipant(studyId, "externalId:" + userId);
}
function getSynapseUserId(studyId, userId) {
  return serverService.getStudyParticipant(studyId, "synapseUserId:" + userId);
}
function getEmail(studyId, userId) {
  return serverService.getStudyParticipants(studyId, {emailFilter: userId}).then(function(response) {
    return response.items.length === 1 ? 
      serverService.getStudyParticipant(studyId, response.items[0].id) : 
      Promise.reject("Participant not found");
  });
}
function makeSuccess(vm, event) {
  return function(response) {
    event.target.parentNode.parentNode.classList.remove("loading");
    document.location = `#/studies/${this.studyId}/participants/${response.id}/general`;
  };
}

export default class StudyParticipant extends BaseStudy {
  constructor(params) {
    super(params, 'studyparticipants');

    fn.copyProps(this, fn, "formatName", "formatDateTime", "formatIdentifiers", "formatNameAsFullLabel");
    this.classNameForStatus = assignClassForStatus;
  
    tables.prepareTable(this, {
      name: "participant",
      id: "studyparticipants",
      delete: (item) => serverService.deleteStudyParticipant(this.studyId, item.id),
      refresh: () => ko.postbox.publish("studyparticipants")
    });
  
    this.binder.obs("find");
    this.loadingFunc = this.loadingFunc.bind(this);

    super.load();
  }
  loadParticipants(response) {
    // TODO: for some reason, we're doing this manually...why?
    this.total = response.total;
    response.items = response.items.map(function(item) {
      item.studyIds = item.studyIds || [];
      if (item.phone) {
        item.phone = fn.flagForRegionCode(item.phone.regionCode) + " " + item.phone.nationalFormat;
      } else {
        item.phone = "";
      }
      return item;
    });
    this.itemsObs(response.items);
    if (response.items.length === 0) {
      this.recordsMessageObs("There are no user accounts, or none that match the filter.");
    }
    return response;
  }
  formatStudyName(id) {
    return this.studyNames[id];
  }
  doSearch(event) {
    event.target.parentNode.parentNode.classList.add("loading");

    let id = this.findObs().trim();
    let success = makeSuccess(this, event);
    utils.startHandler(this, event);

    let promise = null;
    if (id.endsWith('@synapse.org')) {
      promise = utils.synapseAliasToUserId(id).then(getSynapseUserId).then(success);
    } else {
      promise = getHealthCode(params.studyId, id).then(success).catch(() => {
        getExternalId(params.studyId, id).then(success).catch(() => {
          getId(params.studyId, id).then(success).catch(() => {
            getSynapseUserId(params.studyId, id).then(success).catch(() => {
              getEmail(params.studyId, id).then(success).catch((e) => {
                event.target.parentNode.parentNode.classList.remove("loading");
                utils.failureHandler({ transient: false, id: "studyparticipants" })(e);
              });
            });
          });
        });
      });
    }
    promise.catch(utils.failureHandler({id: 'studyparticipants'}));
  }
  exportDialog() {
    root.openDialog("participant_export", { 
      total: this.total, 
      search: this.search, 
      studyId: this.studyId 
    });
  }
  loadingFunc(search) {
    utils.clearErrors();
    this.search = search;

    return options_service.getOrganizationNames()
      .then(map => this.orgNames = map)
      .then(() => options_service.getStudyNames())
      .then(map => this.studyNames = map)
      .then(() => serverService.getStudyParticipants(this.studyId, search))
      .then(this.loadParticipants.bind(this))
      .catch(utils.failureHandler);
  }
}
