import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";
import options_service from "../../services/options_service";

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
  return serverService.getParticipant(studyId, "externalId:" + userId);
}
function getSynapseUserId(studyId, userId) {
  return serverService.getParticipant(studyId, "synapseUserId:" + userId);
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
    document.location = "#/participants/" + response.id + "/general";
  };
}

export default function participants(params) {
  let self = this;

  self.total = 0;

  tables.prepareTable(self, {
    name: "participant",
    id: "studyparticipants",
    delete: (item) => serverService.deleteStudyParticipant(params.studyId, item.id),
    refresh: () => ko.postbox.publish("page-refresh")
  });

  fn.copyProps(self, fn, "formatName", "formatDateTime", "formatIdentifiers", "formatNameAsFullLabel");
  fn.copyProps(self, root, "isAdmin", "isDeveloper", "isResearcher");
  self.classNameForStatus = assignClassForStatus;

  new Binder(self)
    .obs("find", "")
    .obs("title", "New Study")
    .obs("isNew", false)
    .bind("studyId", params.studyId);

  function load(response) {
    self.total = response.total;
    response.items = response.items.map(function(item) {
      item.studyIds = item.studyIds || [];
      if (item.phone) {
        item.phone = fn.flagForRegionCode(item.phone.regionCode) + " " + item.phone.nationalFormat;
      } else {
        item.phone = "";
      }
      return item;
    });
    self.itemsObs(response.items);
    if (response.items.length === 0) {
      self.recordsMessageObs("There are no user accounts, or none that match the filter.");
    }
    return response;
  }

  self.formatStudyName = function(id) {
    return self.studyNames[id];
  }

  self.doSearch = function(event) {
    event.target.parentNode.parentNode.classList.add("loading");

    let id = self.findObs().trim();
    let success = makeSuccess(self, event);
    utils.startHandler(self, event);

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
  };
  self.exportDialog = function() {
    root.openDialog("participant_export", { total: self.total, search: self.search });
  };
  self.loadingFunc = function(search) {
    utils.clearErrors();
    self.search = search;

    return options_service.getOrganizationNames()
      .then((map) => self.orgNames = map)
      .then(() => options_service.getStudyNames())
      .then((map) => self.studyNames = map)
      .then(() => serverService.getStudyParticipants(params.studyId, search))
      .then(load)
      .catch(utils.failureHandler({ id: "studyparticipants" }));
  };

  serverService.getStudy(params.studyId).then(fn.handleObsUpdate(self.titleObs, "name"));
};
