import "knockout-postbox";
import { serverService } from "../../services/server_service";
import alerts from "../../widgets/alerts";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import tables from "../../tables";
import utils from "../../utils";

const cssClassNameForStatus = {
  disabled: "negative",
  unverified: "warning",
  verified: ""
};

function deleteItem(participant) {
  return serverService.deleteParticipant(participant.id);
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

module.exports = function() {
  let self = this;

  self.total = 0;

  tables.prepareTable(self, {
    name: "participant",
    delete: deleteItem,
    refresh: () => ko.postbox.publish("page-refresh")
  });

  self.findObs = ko.observable("");
  fn.copyProps(self, fn, "formatName", "formatDateTime", "formatNameAsFullLabel");
  fn.copyProps(self, root, "isAdmin", "isDeveloper", "isResearcher");

  self.formatIdentifiers = function(item) {
    var array = [];
    if (item.email) {
      array.push(item.email);
    }
    if (item.phone) {
      array.push(item.phone);
    }
    let arrays = Object.values(item.externalIds || []);
    if (arrays.length) {
      array.push(arrays.join(", "));
    }
    if (array.length === 0) {
      array.push("<i>None</i>");
    }
    return array.join(", ");
  };
  self.classNameForStatus = (user) => cssClassNameForStatus[user.status];
  self.deleteVisible = () => root.isResearcher();
  self.disableVisible = (item) => item.status === "enabled" && root.isAdmin();
  self.enableVisible = (item) => item.status === "disabled" && root.isAdmin();
  self.fullName = (user) => encodeURIComponent(fn.formatName(user));
  self.resendVisible = (item) => item.status === "unverified";
  self.resetPwdVisible = (item) => item.status !== "disabled";
  self.signOutVisible = (item) => item.status !== "disabled" && item.status !== "unverified";

  function updateParticipantStatus(participant) {
    participant.status = "enabled";
    return serverService.updateParticipant(participant);
  }
  function publishPageUpdate(response) {
    ko.postbox.publish("page-refresh");
    return response;
  }
  function load(response) {
    self.total = response.total;
    response.items = response.items.map(function(item) {
      item.substudyIds = item.substudyIds || [];
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

    getHealthCode(id).then(success).catch(function() {
      getExternalId(id).then(success).catch(function() {
        getId(id).then(success).catch(function() {
          getEmail(id).then(success).catch(function(e) {
            event.target.parentNode.parentNode.classList.remove("loading");
            utils.failureHandler({ transient: false })(e);
          });
        });
      });
    });
  };

  self.resendEmailVerification = function(vm, event) {
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
      let userId = vm.id;
      utils.startHandler(vm, event);
      serverService.resendEmailVerification(userId)
        .then(utils.successHandler(vm, event, "Sent email to verify participant's email address."))
        .catch(utils.failureHandler());
    });
  };
  self.enableAccount = function(item, event) {
    utils.startHandler(item, event);
    serverService.getParticipant(item.id)
      .then(updateParticipantStatus)
      .then(publishPageUpdate)
      .then(utils.successHandler(item, event, "User account activated."))
      .catch(utils.failureHandler());
  };
  self.exportDialog = function() {
    root.openDialog("participant_export", { total: self.total, search: self.search });
  };
  self.loadingFunc = function(search) {
    utils.clearErrors();
    self.search = search;

    return serverService.searchAccountSummaries(search)
      .then(load)
      .catch(utils.failureHandler());
  };

  self.enableAccount = function(user, event) {
    serverService.getParticipant(user.id)
      .then(function(participant) {
        participant.status = "enabled";
        return serverService.updateParticipant(participant);
      })
      .then(function() {
        serverService.signOutUser(user.id);
        ko.postbox.publish("page-refresh");
      })
      .catch(utils.failureHandler());
  };
  self.disableAccount = function(user, event) {
    serverService.getParticipant(user.id)
      .then(function(participant) {
        participant.status = "disabled";
        return serverService.updateParticipant(participant);
      })
      .then(function() {
        serverService.signOutUser(user.id);
        ko.postbox.publish("page-refresh");
      })
      .catch(utils.failureHandler());
  };
  self.requestResetPassword = function(user, event) {
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
      utils.startHandler(self, event);
      serverService.requestResetPasswordUser(user.id)
        .then(utils.successHandler(self, event, "Reset password email has been sent to user."))
        .catch(utils.failureHandler());
    });
  };
  self.signOutUser = function(user, event) {
    root.openDialog("sign_out_user", { userId: user.id });
  };
  self.deleteTestUser = function(user, event) {
    alerts.confirmation("This will delete the account.\n\nDo you wish to continue?", function() {
      utils.startHandler(self, event);
      serverService.deleteTestUser(user.id)
        .then(utils.successHandler(self, event, "User deleted."))
        .then(() => ko.postbox.publish("page-refresh"))
        .catch(utils.failureHandler({ redirect: false }));
    });
  };
};
