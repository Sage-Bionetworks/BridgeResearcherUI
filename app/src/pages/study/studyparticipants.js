import alerts from "../../widgets/alerts";
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
const PAGE_KEY = 'sp-refresh';

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
    document.location = `/studies/${vm.studyId}/participants/${response.id}/general`;
  };
}

export default class StudyParticipants extends BaseStudy {
  constructor(params) {
    super(params, 'studyparticipants');

    fn.copyProps(this, fn, "formatName", "formatDateTime", "formatParticipantLabel");
    fn.copyProps(this, root, "isResearcher");

    this.search = storeService.restoreQuery("sp", "allOfGroups", "noneOfGroups");
    this.classNameForStatus = assignClassForStatus;
    this.doSearch = this.doSearch.bind(this);
    this.loadingFunc = this.loadingFunc.bind(this);

    let { defaultStart, defaultEnd } = fn.getRangeInDays(-14, 0);
  
    tables.prepareTable(this, {
      name: "participant",
      id: "studyparticipants",
      delete: (item) => serverService.deleteStudyParticipant(this.studyId, item.id),
      refresh: () => ko.postbox.publish(PAGE_KEY)
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
      .obs("status", this.search.status)
      .obs("enrollment", this.search.enrollment)
      .obs("attributeKey", this.search.attributeKey)
      .obs("attributeValueFilter", this.search.attributeValueFilter)
      .obs("attributeKeys[]", [])
      .obs("predicate", "and");

    super.load()
      .then(() => options_service.getOrganizationNames())
      .then(map => this.orgNames = map)
      .then(() => options_service.getStudyNames())
      .then(map => this.studyNames = map)
      .then(() => serverService.getApp())
      .then(fn.handleObsUpdate(this.dataGroupsObs, "dataGroups"))
      .then(app => this.attributeKeysObs(
          app.userProfileAttributes.sort().map(att => ({ value: att, label: att }))))
      .then(() => ko.postbox.publish(PAGE_KEY))
  }
  canDelete(item) {
    return item.dataGroups.includes('test_user');
  }
  formatStudyName(id) {
    return this.studyNames[id];
  }
  formatStatus(item) {
    return (item.studyIds.includes(this.studyId))  ? "Enrolled" : "Withdrawn";
  }
  isWithdrawn(item) {
    return !item.studyIds.includes(this.studyId);
  }
  exportDialog() {
    this.search = this.updateSearch();
    root.openDialog("participant_export", {studyId: this.studyId});
  }
  importDialog(vm, event) {
    root.openDialog("external_id_importer", {
      vm: this,
      studyId: this.studyId,
      reload: this.loadingFunc
    });
  }
  enrollDialog () {
    root.openDialog("add_enrollment", {
      closeFunc: fn.seq(root.closeDialog, () => ko.postbox.publish(PAGE_KEY, 0)),
      studyId: this.studyId
    });
  }
  doFormSearch(vm, event) {
    if (event.keyCode === 13)  {
      ko.postbox.publish(PAGE_KEY, vm.search.offsetBy);
    }
  }
  searchButton() {
    ko.postbox.publish(PAGE_KEY, this.search.offsetBy);
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
  clear() {
    this.emailFilterObs(null);
    this.phoneFilterObs(null);
    this.externalIdFilterObs(null);
    this.startTimeObs(null);
    this.endTimeObs(null);
    this.languageObs(null);
    this.allOfGroupsObs([]);
    this.noneOfGroupsObs([]);
    this.statusObs(null);
    this.enrollmentObs('all');
    this.attributeKeyObs(null);
    this.attributeValueFilterObs(null);
    this.predicateObs("and");
    ko.postbox.publish(PAGE_KEY, 0)
  }
  updateSearch() {
    let search = this.search;
    search.emailFilter = this.emailFilterObs();
    search.phoneFilter = this.phoneFilterObs();
    search.externalIdFilter = this.externalIdFilterObs();
    search.allOfGroups = this.allOfGroupsObs();
    search.noneOfGroups = this.noneOfGroupsObs();
    search.language = this.languageObs() ? this.languageObs() : null;
    search.startTime = this.startTimeObs();
    search.endTime = this.endTimeObs();
    search.status = this.statusObs();
    search.enrollment = this.enrollmentObs();
    search.predicate = this.predicateObs();
    if (this.attributeValueFilterObs()) {
      search.attributeKey = this.attributeKeyObs();
      search.attributeValueFilter = this.attributeValueFilterObs();
    } else {
      delete search.attributeKey;
      delete search.attributeValueFilter;
    }
    if (search.status === '') {
      delete search.status;
    }
    if (search.enrollment === '') {
      delete search.enrollment;
    }
    if (fn.is(search.startTime, "Date")) {
      search.startTime.setHours(0, 0, 0, 0);
    }
    if (fn.is(search.endTime, "Date")) {
      search.endTime.setHours(23, 59, 59, 999);
    }
    return search;
  }
  loadingFunc(offsetBy) {
    this.search.offsetBy = offsetBy;
    let search = this.updateSearch();

    this.search = search;
    storeService.persistQuery("sp", search);
    this.formattedSearchObs(fn.formatSearch(search));

    utils.clearErrors();
    return serverService.getStudyParticipants(this.studyId, search)
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(req => {
        // because test_user can be set by the server, update if it's there
        this.allOfGroupsObs(req.requestParams.allOfGroups);
        this.noneOfGroupsObs(req.requestParams.noneOfGroups);
        this.formattedSearchObs(fn.formatSearch(req.requestParams));
        return req;
      })
      .catch(this.failureHandler);
  }
}
