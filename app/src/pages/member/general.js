import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";

const NEW_ACCOUNT = { id: "new", attributes: {}, email: "", phone: { number: "", regionCode: "US" } };

function selectRoles(session) {
  let set = new Set();
  for (let i = 0; i < session.roles.length; i++) {
    var role = session.roles[i];
    switch (role) {
      case "superadmin":
        set.add("Super Admin");
        /* falls through */
      case "admin":
        set.add("Worker");
        set.add("Administrator");
        /* falls through */
      case "org_admin":
        set.add("Organization Administrator");
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

export default function general(params) {
  const failureHandler = utils.failureHandler({
    id: "mem-general",
    redirectTo: "organizations/" + params.orgId + "/members",
    redirectMsg: "Organization member not found"
  });
  
  let self = this;
  self.account = NEW_ACCOUNT;
  self.orgNames = {};

  let binder = new Binder(self)
    .obs("showEnableAccount", false)
    .obs("isNew", params.userId === "new")
    .obs("allDataGroups[]")
    .obs("createdOn", null, fn.formatDateTime)
    .obs("modifiedOn", null, fn.formatDateTime)
    .obs("allRoles[]", [])
    .obs("allStudies[]")
    .obs("title", params.userId === "new" ? "New account" : "&#160;")
    .bind("email", null, null, value => (fn.isBlank(value) ? null : value))
    .bind("phone", null, Binder.formatPhone, Binder.persistPhone)
    .bind("phoneRegion", "US")
    .bind("attributes[]", [], Binder.formatAttributes, Binder.persistAttributes)
    .bind("emailVerified", false)
    .bind("phoneVerified", false)
    .bind("synapseUserId", null, null, (value) => (value) ? value : null)
    .bind("firstName")
    .bind("lastName")
    .bind("notifyByEmail")
    .bind("dataGroups[]")
    .bind("password")
    .bind("languages", null, fn.formatLanguages, fn.persistLanguages)
    .bind("status")
    .bind("userId", params.userId)
    .bind("id", params.userId)
    .bind("roles[]", null, fn.formatRoles, fn.persistRoles)
    .bind("orgMembership", params.orgId)
    .bind("orgName");

  fn.copyProps(self, root, "isAdmin", "isOrgAdmin");
  fn.copyProps(self, params, "orgId", "userId");

  self.statusObs.subscribe(function(status) {
    self.showEnableAccountObs(status !== "enabled");
  });
  self.addIdentifier = function(credential) {
    return () => {
      let params = {
        editor: credential,
        closeDialog: root.closeDialog,
        appId: root.appIdObs()
      };
      if (credential === 'email') {
        params.email = self.emailObs();
      } else if (credential === 'phone') {
        params.phone = self.phoneObs();
        params.phoneRegion = self.phoneRegionObs();
      } else if (credential === 'synapseUserId') {
        params.synapseUserId = self.synapseUserIdObs();
      }
      root.openDialog('update_identifiers_dialog', params);
    };
  };
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
  self.showIdentifier = function(credential) {
    return ko.computed(() => {
      return self[credential + 'Obs']();
    });
  };
  self.showAddIdentifier = function(credential) {
    return ko.computed(() => {
      return !self[credential + 'Obs']() && self.updateIdsVisible();
    });
  };
  self.showDash = function(credential) {
    return ko.computed(() => {
      return !self[credential + 'Obs']() && !self.updateIdsVisible();
    });
  };

  function makeStatusChanger(status) {
    return function(vm, event) {
      serverService.getAccount(self.userIdObs()).then((account) => {
          account.status = status;
          return account;
        })
        .then((acct) => serverService.updateAccount(self.userIdObs(), acct))
        .then((acct) => self.statusObs(acct.status))
        .then(() => serverService.signOutAccount(self.userIdObs()))
        .then(utils.successHandler(self, event, "User account has been "+status+"."))
        .catch(utils.failureHandler({id: 'mem-general'}));
    }
  }

  self.enableAccount = makeStatusChanger("enabled");
  self.disableAccount = makeStatusChanger("disabled");
  self.requestResetPassword = function(vm, event) {
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
      utils.startHandler(self, event);
      serverService.requestAccountResetPassword(self.userIdObs())
        .then(utils.successHandler(self, event, "Reset password email has been sent to user."))
        .catch(utils.failureHandler({id: 'mem-general'}));
    });
  };
  self.signOutUser = function() {
    root.openDialog("sign_out_user", { userId: self.userIdObs(), accounts: true });
  };
  self.deleteUser = function(vm, event) {
    alerts.confirmation("This will delete the account.\n\nDo you wish to continue?", function() {
      utils.startHandler(self, event);
      serverService.deleteAccount(self.userIdObs())
        .then(utils.successHandler(self, event, "User deleted."))
        .then(() => window.location = "#/organizations/" + params.orgId + "/members")
        .catch(utils.failureHandler({id: 'mem-general'}));
    });
  };
  self.resendEmailVerification = function(vm, event) {
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
      utils.startHandler(vm, event);
      serverService.resendAccountEmailVerification(self.userIdObs())
        .then(utils.successHandler(vm, event, "Sent email to verify account’s email address."))
        .catch(utils.failureHandler({id: 'mem-general'}));
    });
  };
  self.resendPhoneVerification = function(vm, event) {
    alerts.confirmation("This will send an SMS message to this user.\n\nDo you wish to continue?", function() {
      utils.startHandler(vm, event);
      serverService.resendAccountPhoneVerification(self.userIdObs())
        .then(utils.successHandler(vm, event, "Sent message to verify account’s phone number."))
        .catch(utils.failureHandler({id: 'mem-general'}));
    });
  };

  self.resendEmailVisible = ko.computed(() => self.emailObs() && !self.emailVerifiedObs());
  self.resendPhoneVisible = ko.computed(() => self.phoneObs() && !self.phoneVerifiedObs());
  self.enableVisible = ko.computed(() => self.statusObs() === "disabled" && root.isAdmin());
  self.disableVisible = ko.computed(() => self.statusObs() === "enabled" && root.isAdmin());
  self.deleteVisible = ko.computed(() => self.isAdmin());
  self.updateIdsVisible = ko.observable(false);

  serverService.getSession().then(session => {
    var roles = selectRoles(session);
    self.allRolesObs(roles);
    self.updateIdsVisible(session.id === self.idObs());
  });

  function initApp(app) {
    // there's a timer in the control involved here, we need to use an observer
    self.allDataGroupsObs(app.dataGroups || []);

    let attrs = self.app.userProfileAttributes.map(function(key) {
      return { key: key, label: fn.formatTitleCase(key, ""), obs: ko.observable() };
    });
    self.attributesObs(attrs);
  }
  function getAccount(response) {
    return self.isNewObs() ? 
      Promise.resolve(NEW_ACCOUNT) : 
      serverService.getAccount(self.userIdObs());
  }
  function afterCreate(response) {
    self.statusObs("enabled");
    self.isNewObs(false);
    self.idObs(response.identifier);
    self.userIdObs(response.identifier);
    return response;
  }
  function saveAccount(account) {
    if (self.isNewObs()) {
      return serverService.createAccount(account)
        .then(afterCreate)
        .then(response => (window.location = "#/organizations/" + params.orgId + 
          "/members/" + response.identifier + "/general"));
    } else {
      return serverService.updateAccount(account.id, account);
    }
  }

  self.formatPhone = function(phone, phoneRegion) {
    return phone ? fn.flagForRegionCode(phoneRegion) + " " + phone : "";
  };

  function updateSynapseUserId(account) {
    let value = self.synapseUserIdObs();
    if (value === '' || /^\d+$/.test(value)) {
      return Promise.resolve();
    }
    return utils.synapseAliasToUserId(value).then((id) => {
      account.synapseUserId = id;
      self.synapseUserIdObs(id);
    });
  }

  self.save = function(vm, event) {
    let account = binder.persist(self.account);
    let confirmMsg = (self.isNewObs()) ? "Account created." : "Account updated.";

    let updatedTitle = self.app.emailVerificationEnabled ? 
      fn.formatNameAsFullLabel(account) : 
      account.externalId;
    function updateName() {
      self.titleObs(updatedTitle);
      return serverService.getAccount(self.userIdObs());
    }

    utils.startHandler(vm, event);
    return updateSynapseUserId(account)
      .then(() => saveAccount(account))
      .then(updateName)
      .then(binder.update())
      .then(utils.successHandler(vm, event, confirmMsg))
      .catch(failureHandler);
  };
  function noteInitialStatus(account) {
    // The general page can be linked to using externalId: or healthCode:... here we
    // fix the ID to the be real ID, then use that to call getAccountName
    self.userIdObs(account.id);
    if (!self.isNewObs()) {
      serverService.getAccountName(account.id).then(function(acct) {
        self.titleObs(acct.name);
      }).catch(failureHandler);
    }
    return account;
  }

  serverService.getApp()
    .then(binder.assign("app"))
    .then(initApp)
    .then(optionsService.getOrganizationNames)
    .then((response) => {
      self.orgNames = response;
      self.orgNameObs(self.orgNames[params.orgId]);
    })
    .then(getAccount)
    .then(binder.assign("account"))
    .then(noteInitialStatus)
    .then(binder.update())
    .catch(failureHandler);
};
