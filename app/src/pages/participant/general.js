import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

const failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found"
});
const OPTIONS = [
  { value: "no_sharing", label: "No Sharing" },
  { value: "sponsors_and_partners", label: "Sponsors And Partners" },
  { value: "all_qualified_researchers", label: "All Qualified Researchers" }
];
const NEW_PARTICIPANT = { id: "new", attributes: {}, email: "", phone: { number: "", regionCode: "US" } };

function selectRoles(session) {
  let set = new Set();
  for (let i = 0; i < session.roles.length; i++) {
    var role = session.roles[i];
    switch (role) {
      case "admin":
        set.add("Worker");
        set.add("Administrator");
        /* falls through */
      case "researcher":
        set.add("Researcher");
        /* falls through */
      case "developer":
        set.add("Developer");
        /* falls through */
    }
  }
  var roles = Array.from(set);
  roles.sort();
  return roles;
}
function persistExternalId(value, context) {
  if (value) {
    context.copy.externalId = value;
  }
  return value;
}

export default function general(params) {
  let self = this;
  self.participant = NEW_PARTICIPANT;

  let binder = new Binder(self)
    .obs("showEnableAccount", false)
    .obs("isNew", params.userId === "new")
    .obs("healthCode", "N/A", Binder.formatHealthCode)
    .obs("allDataGroups[]")
    .obs("createdOn", null, fn.formatDateTime)
    .obs("allRoles[]", [])
    .obs("allSubstudies[]")
    .obs("title", params.userId === "new" ? "New participant" : "&#160;")
    .obs("externalIds", '', Binder.formatExternalIds)
    .bind("newExternalId", null, null, persistExternalId)
    .bind("email", null, null, value => (fn.isBlank(value) ? null : value))
    .bind("phone", null, Binder.formatPhone, Binder.persistPhone)
    .bind("phoneRegion", "US")
    .bind("attributes[]", [], Binder.formatAttributes, Binder.persistAttributes)
    .bind("emailVerified", false)
    .bind("phoneVerified", false)
    .bind("lookingUpSynapseId", false)
    .bind("synapseUserId", null, null, (value) => (value) ? value : null)
    .bind("firstName")
    .bind("lastName")
    .bind("sharingScope")
    .bind("notifyByEmail")
    .bind("dataGroups[]")
    .bind("password")
    .bind("languages", null, fn.formatLanguages, fn.persistLanguages)
    .bind("status")
    .bind("userId", params.userId)
    .bind("id", params.userId)
    .bind("roles[]", null, fn.formatRoles, fn.persistRoles)
    .bind("substudyIds[]");

  fn.copyProps(self, root, "isAdmin");

  self.synapseUserIdObs.extend({ rateLimit: 1000 });
  self.synapseUserIdObs.subscribe((value) => {
    if (value === '' || /^\d+$/.test(value)) {
      self.lookingUpSynapseIdObs(false);
      return;
    }
    self.lookingUpSynapseIdObs(true);
    value = value.replace('@synapse.org', '');
    fetch('https://repo-prod.prod.sagebase.org/repo/v1/principal/alias', {
      method: 'POST',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({"alias": value, "type": "USER_NAME"})
    }).then(response => {
      response.json().then((json) => {
        if (json.principalId) {
          self.synapseUserIdObs(json.principalId);
        }
      })
    }).catch(() => self.lookingUpSynapseIdObs(false));
  });

  self.statusObs.subscribe(function(status) {
    self.showEnableAccountObs(status !== "enabled");
  });

  self.emailLink = ko.computed(function() {
    return "mailto:" + self.emailObs();
  });
  self.phoneLink = ko.computed(function() {
    return "tel:" + self.phoneObs();
  });
  self.updateRegion = function(model, event) {
    if (event.target.classList.contains("item")) {
      self.phoneRegionObs(event.target.textContent);
    }
  };
  self.formatSynapseUserId = function(value) {
    return (value) ? value : '—';
  }

  function makeStatusChanger(status) {
    return function(vm, event) {
      serverService.getParticipant(self.userIdObs())
        .then((participant) => {
          participant.status = status;
          return participant;
        })
        .then((p) => serverService.updateParticipant(p))
        .then(() => self.statusObs(status))
        .then(() => serverService.signOutUser(self.userIdObs()))
        .then(utils.successHandler(self, event, "User account has been "+status+"."))
        .catch(utils.failureHandler());
    }
  }

  self.enableAccount = makeStatusChanger("enabled");
  self.disableAccount = makeStatusChanger("disabled");
  self.requestResetPassword = function(vm, event) {
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
      utils.startHandler(self, event);
      serverService.requestResetPasswordUser(self.userIdObs())
        .then(utils.successHandler(self, event, "Reset password email has been sent to user."))
        .catch(utils.failureHandler());
    });
  };
  self.signOutUser = function() {
    root.openDialog("sign_out_user", { userId: self.userIdObs() });
  };
  self.deleteTestUser = function(vm, event) {
    alerts.confirmation("This will delete the account.\n\nDo you wish to continue?", function() {
      utils.startHandler(self, event);
      serverService.deleteTestUser(self.userIdObs())
        .then(utils.successHandler(self, event, "User deleted."))
        .then(() => document.location = "#/participants")
        .catch(utils.failureHandler());
    });
  };
  self.resendEmailVerification = function(vm, event) {
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
      utils.startHandler(vm, event);
      serverService.resendEmailVerification(self.userIdObs())
        .then(utils.successHandler(vm, event, "Sent email to verify participant's email address."))
        .catch(utils.failureHandler());
    });
  };

  self.resendVisible = ko.computed(() => self.statusObs() === "unverified");
  self.resetPwdVisible = ko.computed(() => self.statusObs() !== "disabled");
  self.enableVisible = ko.computed(() => self.statusObs() === "disabled" && root.isAdmin());
  self.disableVisible = ko.computed(() => self.statusObs() === "enabled" && root.isAdmin());
  self.signOutVisible = ko.computed(() => !['disabled','unverified'].includes(self.statusObs()));
  self.deleteVisible = ko.computed(() => root.isResearcher() && self.dataGroupsObs().includes('test_user'));

  serverService.getSession().then(session => {
    var roles = selectRoles(session);
    self.allRolesObs(roles);
  });

  function initStudy(study) {
    // there's a timer in the control involved here, we need to use an observer
    self.allDataGroupsObs(study.dataGroups || []);

    let attrs = self.study.userProfileAttributes.map(function(key) {
      return { key: key, label: fn.formatTitleCase(key, ""), obs: ko.observable() };
    });
    self.attributesObs(attrs);
  }
  function getParticipant(response) {
    return self.isNewObs() ? Promise.resolve(NEW_PARTICIPANT) : serverService.getParticipant(self.userIdObs());
  }
  function afterCreate(response) {
    self.statusObs("enabled");
    self.isNewObs(false);
    self.idObs(response.identifier);
    self.userIdObs(response.identifier);
    return response;
  }
  function saveParticipant(participant) {
    if (self.isNewObs()) {
      return serverService
        .createParticipant(participant)
        .then(afterCreate)
        .then(response => (window.location = "#/participants/" + response.identifier + "/general"));
    } else {
      return serverService.updateParticipant(participant);
    }
  }
  self.sharingScopeOptions = OPTIONS;

  self.formatPhone = function(phone, phoneRegion) {
    return phone ? fn.flagForRegionCode(phoneRegion) + " " + phone : "";
  };

  self.save = function(vm, event) {
    let participant = binder.persist(self.participant);
    let confirmMsg = (self.isNewObs()) ? "Participant created." : "Participant updated.";

    let updatedTitle = self.study.emailVerificationEnabled ? 
      fn.formatNameAsFullLabel(participant) : 
      participant.externalId;
    function updateName() {
      self.titleObs(updatedTitle);
      return serverService.getParticipant(self.userIdObs());
    }

    utils.startHandler(vm, event);
    return saveParticipant(participant)
      .then(updateName)
      .then(binder.update())
      .then(() => self.newExternalIdObs(null))
      .then(utils.successHandler(vm, event, confirmMsg))
      .catch(failureHandler);
  };
  function noteInitialStatus(participant) {
    // The general page can be linked to using externalId: or healthCode:... here we
    // fix the ID to the be real ID, then use that to call getParticipantName
    self.userIdObs(participant.id);
    if (!self.isNewObs()) {
      serverService
        .getParticipantName(participant.id)
        .then(function(part) {
          self.titleObs(part.name);
        })
        .catch(failureHandler);
    }
    return participant;
  }
  function getSession() {
    return serverService.getSession();
  }
  function updateAllSubstudiesObs(session) {
    if (self.isNewObs() || self.isAdmin()) {
      return serverService.getSubstudies(false).then(response => {
        self.allSubstudiesObs(response.items.map(item => item.id));
      });
    } else {
      self.allSubstudiesObs(session.substudyIds);
    }
  }

  serverService
    .getStudy()
    .then(binder.assign("study"))
    .then(initStudy)
    .then(getParticipant)
    .then(binder.assign("participant"))
    .then(noteInitialStatus)
    .then(binder.update())
    .then(getSession)
    .then(updateAllSubstudiesObs)
    .catch(failureHandler);
};
