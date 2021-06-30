import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import storeService from "../../services/store_service";
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
    document.location = `#/studies/${vm.studyId}/participants/${response.id}/general`;
  };
}

export default class StudyParticipant extends BaseStudy {
  constructor(params) {
    super(params, 'studyparticipants');

    fn.copyProps(this, fn, "formatName", "formatDateTime", "formatIdentifiers", "formatNameAsFullLabel");

    this.search = storeService.restoreQuery("sp", "allOfGroups", "noneOfGroups");
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;
    this.classNameForStatus = assignClassForStatus;
    this.doSearch = this.doSearch.bind(this);

    let { defaultStart, defaultEnd } = fn.getRangeInDays(-14, 0);
  
    tables.prepareTable(this, {
      name: "participant",
      id: "studyparticipants",
      delete: (item) => serverService.deleteStudyParticipant(this.studyId, item.id),
      refresh: () => ko.postbox.publish("studyparticipants")
    });
  
    this.binder
      .obs("find")
      .obs("emailFilter", this.search.emailFilter)
      .obs("phoneFilter", this.search.phoneFilter)
      .obs("externalIdFilter", this.search.externalIdFilter)
      .obs("startTime", this.search.startTime || defaultStart)
      .obs("endTime", this.search.endTime || defaultEnd)
      .obs("formattedSearch", "")
      .obs("language", this.search.language)
      .obs("dataGroups[]", this.search.dataGroups)
      .obs("allOfGroups[]", this.search.allOfGroups)
      .obs("noneOfGroups[]", this.search.noneOfGroups)
      .obs("statusFilter", this.search.statusFilter)
      .obs("enrollmentFilter", this.search.enrollmentFilter)
      .obs("attributeKey", this.search.attributeKey)
      .obs("attributeValue", this.search.attributeValue)
      .obs("attributeKeys[]", [])
      .obs('searchLoading');

    this.loadingFunc = this.loadingFunc.bind(this);

    super.load()
      .then(() => options_service.getOrganizationNames())
      .then(map => this.orgNames = map)
      .then(() => options_service.getStudyNames())
      .then(map => this.studyNames = map)
      .then(() => serverService.getApp())
      .then(app => {
        this.dataGroupsObs(app.dataGroups);
        this.attributeKeysObs(app.userProfileAttributes.sort().map(att => ({ value: att, label: att })));
      });
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
      promise = getHealthCode(this.studyId, id).then(success).catch(() => {
        getExternalId(this.studyId, id).then(success).catch(() => {
          getId(this.studyId, id).then(success).catch(() => {
            getSynapseUserId(this.studyId, id).then(success).catch(() => {
              getEmail(this.studyId, id).then(success).catch((e) => {
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
  clear() {
    this.emailFilterObs(null);
    this.phoneFilterObs(null);
    this.externalIdFilterObs(null);
    this.startTimeObs(null);
    this.endTimeObs(null);
    this.languageObs(null);
    this.allOfGroupsObs([]);
    this.noneOfGroupsObs([]);
    this.statusFilterObs(null);
    this.enrollmentFilterObs('all');
    this.attributeKeyObs(null);
    this.attributeValueObs(null);
  }
  doFormSearch(vm, event) {
    if (event.keyCode === 13)  {
      ko.postbox.publish('studyparticipants', vm.search.offsetBy);
    }
  }
  searchButton() {
    ko.postbox.publish('studyparticipants', this.search.offsetBy);
  }
  formatStatus(item) {
    if (item.externalIds[this.studyId]) {
      return "Enrolled";
    }
    return "Withdrawn";
  }
  loadingFunc(search) {
    search.emailFilter = this.emailFilterObs();
    search.phoneFilter = this.phoneFilterObs();
    search.externalIdFilter = this.externalIdFilterObs();
    search.allOfGroups = this.allOfGroupsObs();
    search.noneOfGroups = this.noneOfGroupsObs();
    search.language = this.languageObs() ? this.languageObs() : null;
    search.startTime = this.startTimeObs();
    search.endTime = this.endTimeObs();
    search.statusFilter = this.statusFilterObs();
    search.enrollmentFilter = this.enrollmentFilterObs();
    if (this.attributeValueObs()) {
      search.attributeKey = this.attributeKeyObs();
      search.attributeValue = this.attributeValueObs();
    } else {
      delete search.attributeKey;
      delete search.attributeValue;
    }
    search.adminOnly = false; // TODO: enforce on server
    search.enrolledInStudy = this.studyId; //  TODO: enforce on server
    if (search.statusFilter === '') {
      delete search.statusFilter;
    }
    if (search.enrollmentFilter === '') {
      delete search.enrollmentFilter;
    }
    if (fn.is(search.startTime, "Date")) {
      search.startTime.setHours(0, 0, 0, 0);
    }
    if (fn.is(search.endTime, "Date")) {
      search.endTime.setHours(23, 59, 59, 999);
    }

    this.search = search;
    storeService.persistQuery("sp", search);
    this.formattedSearchObs(fn.formatSearch(search));

    utils.clearErrors();
    return serverService.getStudyParticipants(this.studyId, search)
      .then(this.loadParticipants.bind(this))
      .catch(this.failureHandler);
  }
}
