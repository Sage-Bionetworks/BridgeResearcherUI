import alerts from "../../widgets/alerts";
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
function getId(id) {
  return serverService.getParticipant(id);
}
function getHealthCode(id) {
  return serverService.getParticipant("healthCode:" + id);
}
function getExternalId(id) {
  return serverService.getParticipant("externalId:" + id);
}
function getSynapseUserId(id) {
  return serverService.getParticipant("synapseUserId:" + id);
}
function getEmail(id) {
  return serverService.getParticipants(0, 5, id).then(function(response) {
    return response.items.length === 1 ? 
      serverService.getParticipant(response.items[0].id) : 
      Promise.reject("Participant not found");
  });
}
function makeSuccess(vm, event) {
  return function(response) {
    event.target.parentNode.parentNode.classList.remove("loading");
    document.location = "#/participants/" + response.id + "/general";
  };
}

export default function participants() {
  let self = this;

  self.total = 0;

  tables.prepareTable(self, {
    name: "participant",
    id: "participants",
    delete: (item) => serverService.deleteParticipant(item.id),
    refresh: () => ko.postbox.publish("page-refresh")
  });

  self.findObs = ko.observable("");
  fn.copyProps(self, fn, "formatName", "formatDateTime", "formatIdentifiers", "formatNameAsFullLabel");
  fn.copyProps(self, root, "isAdmin", "isDeveloper", "isResearcher");

  self.classNameForStatus = assignClassForStatus;

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

  self.doSearch = function(event) {
    event.target.parentNode.parentNode.classList.add("loading");

    let id = self.findObs().trim();
    let success = makeSuccess(self, event);
    utils.startHandler(self, event);

    let promise = null;
    if (id.endsWith('@synapse.org')) {
      promise = utils.synapseAliasToUserId(id)
        .then(getSynapseUserId).then(success);
    } else {
      promise = getHealthCode(id).then(success).catch(() => {
        getExternalId(id).then(success).catch(() => {
          getId(id).then(success).catch(() => {
            getSynapseUserId(id).then(success).catch(() => {
              getEmail(id).then(success).catch((e) => {
                event.target.parentNode.parentNode.classList.remove("loading");
                utils.failureHandler({ transient: false, id: "participants" })(e);
              });
            });
          });
        });
      });
    }
  };
  self.exportDialog = function() {
    root.openDialog("participant_export", { total: self.total, search: self.search });
  };

  options_service.getOrganizationNames().then(map => console.log(map));

  self.loadingFunc = function(search) {
    utils.clearErrors();
    self.search = search;

    return options_service.getOrganizationNames()
      .then((map) => self.orgNames = map)
      .then(() => serverService.searchAccountSummaries(search))
      .then(load)
      .catch(utils.failureHandler({ id: "participants" }));
  };
};
