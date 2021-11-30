import alerts from "../widgets/alerts";
import BaseAccount from "./base_account";
import Binder from "../binder";
import config from "../config";
import { TIME_ZONES } from "../config";
import fn from "../functions";
import ko from "knockout";
import optionsService from "../services/options_service";
import root from "../root";
import serverService from "../services/server_service";
import utils from "../utils";

const OPTIONS = [
  { value: "no_sharing", label: "No Sharing" },
  { value: "sponsors_and_partners", label: "Sponsors And Partners" },
  { value: "all_qualified_researchers", label: "All Qualified Researchers" }
];

function selectRoles(session) {
  let set = new Set();
  for (let i = 0; i < session.roles.length; i++) {
    const role = session.roles[i];
    config.canBeEditedBy[role].forEach(role => set.add(role));
  }
  var roles = Array.from(set);
  roles.sort();
  return roles;
}

function persistExternalId(value, context) {
  if (value && context.vm.studyIdObs() !== 'Select study') {
    context.copy.externalIds = {
      [context.vm.studyIdObs()]: context.vm.newExternalIdObs()
    };
  }
  return value;
}

function studyToOptions(study) {
  return { label: study.name, value: study.identifier };
}

export default class GeneralBaseAccount extends BaseAccount {
  constructor(params) {
    super(params);

    this.orgNames = {};

    this.binder.obs("isNew", params.userId === "new")
      .obs("healthCode", "N/A", Binder.formatHealthCode)
      .obs("createdOn", null, fn.formatDateTime)
      .obs("modifiedOn", null, fn.formatDateTime)
      .obs("allRoles[]", [])
      .obs("allStudies[]")
      .obs("title", params.userId === "new" ? "New participant" : "&#160;")
      .obs("externalIds", '', Binder.formatExternalIds)
      .bind("newExternalId", null, null, persistExternalId)
      .bind("email", null, null, value => (fn.isBlank(value) ? null : value))
      .bind("phone")
      .bind("emailVerified", false)
      .bind("phoneVerified", false)
      .bind("synapseUserId", null, null, (value) => (value) ? value : null)
      .bind("firstName")
      .bind("lastName")
      .bind("notifyByEmail")
      .bind("clientTimeZone")
      .bind("dataGroups[]")
      .bind("password")
      .bind("languages", null, fn.formatLanguages, fn.persistLanguages)
      .bind("status")
      .bind("userId", params.userId)
      .bind("id", params.userId)
      .bind("roles[]", null, fn.formatRoles, fn.persistRoles)
      .bind("studyId")
      .bind("studyLabel", 'Select study')
      .bind("orgMembership", this.orgId)
      .bind("note");

    // subscribers
    this.emailLink = ko.computed(() => "mailto:" + this.emailObs());
    this.phoneLink = ko.computed(() => "tel:" + (this.phoneObs() ? this.phoneObs().number : ''));
    this.resendEmailVisible = ko.computed(() => this.emailObs() && !this.emailVerifiedObs());
    this.resendPhoneVisible = ko.computed(() => this.phoneObs() && !this.phoneVerifiedObs());
    this.resetPwdVisible = ko.computed(() => this.statusObs() !== "disabled");
    this.enableVisible = ko.computed(() => this.statusObs() === "disabled" && root.isAdmin());
    this.disableVisible = ko.computed(() => this.statusObs() === "enabled" && root.isAdmin());
    this.signOutVisible = ko.computed(() => !['disabled','unverified'].includes(this.statusObs()));
    this.updateIdsVisible = ko.observable(false);
    this.installLinkVisible = ko.observable(true);
    
    this.enableAccount = this.makeStatusChanger("enabled");
    this.disableAccount = this.makeStatusChanger("disabled");
    this.sharingScopeOptions = OPTIONS;
    this.timeZoneOptions = TIME_ZONES;

    serverService.getSession().then(session => {
      var roles = selectRoles(session);
      this.allRolesObs(roles);
      this.updateIdsVisible(session.id === this.idObs());
    });
    optionsService.getOrganizationNames()
      .then((response) => this.orgNames = response)
      .then(() => this.getAccount())
      .then(this.binder.assign("account"))
      .then(this.binder.update())
      .then(() => this.updateAllStudiesObs())
      .catch(utils.failureHandler(this.failureParams));
  }
  sendInstallLink(vm, event) {
    utils.startHandler(vm, event);
    this.installLink()
      .then(utils.successHandler(this, event, "Message has been sent to user."))
      .catch(utils.failureHandler(this.failureParams));
  }
  addIdentifier(credential) {
    return () => {
      let params = {
        editor: credential,
        closeDialog: root.closeDialog,
        appId: root.appIdObs()
      };
      if (credential === 'email') {
        params.email = this.emailObs();
      } else if (credential === 'phone') {
        params.phone = this.phoneObs();
      } else if (credential === 'synapseUserId') {
        params.synapseUserId = this.synapseUserIdObs();
      }
      root.openDialog('update_identifiers_dialog', params);
    }
  }
  updateStudy(model, event) {
    if (event.target.classList.contains("item")) {
      this.studyIdObs(event.target.getAttribute('data-id'));
      this.studyLabelObs(event.target.textContent);
    }
  }
  showIdentifier(credential) {
    return ko.computed(() => this[credential + 'Obs']());
  };
  showAddIdentifier(credential) {
    return ko.computed(() => !this[credential + 'Obs']() && this.updateIdsVisible());
  }
  showDash(credential) {
    return ko.computed(() => !this[credential + 'Obs']() && !this.updateIdsVisible());
  };
  formatOrg() {
    return this.orgMembershipObs() ? this.orgNames[this.orgMembershipObs()] : '—';
  }
  formatPhone(phone) {
    return (phone) ? fn.flagForRegionCode(phone.regionCode) + " " + phone.number : "";
  }
  makeStatusChanger(status) {
    return (vm, event) => {
      this.getAccount().then(participant => {
          this.account = participant;
          this.account.status = status;
          return this.account;
        })
        .then(vm.updateAccount.bind(vm))
        .then(() => vm.statusObs(status))
        .then(vm.signOutAccount.bind(vm))
        .then(utils.successHandler(vm, event, "User account has been "+status+"."))
        .catch(utils.failureHandler(vm.failureParams));
    }
  }
  requestResetPassword(vm, event) {
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", () => {
      utils.startHandler(vm, event);
      this.requestAccountResetPassword()
        .then(utils.successHandler(this, event, "Reset password email has been sent to user."))
        .catch(utils.failureHandler(this.failureParams));
    });
  }
  signOutUser() {
    root.openDialog("sign_out_user", { userId: this.userId });
  }
  deleteUser(vm, event) {
    alerts.confirmation("Only test and unused accounts can be deleted. This cannot be undone. Do you wish to continue?", () => {
      utils.startHandler(vm, event);
      this.deleteAccount()
        .then(() => setTimeout(utils.successHandler(this, event, "User deleted."), 500))
        .catch(utils.failureHandler({...this.failureParams, redirect: false}));
    });
  }
  resendEmailVerification(vm, event) {
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", () => {
      utils.startHandler(vm, event);
      this.resendAccountEmailVerification()
        .then(utils.successHandler(vm, event, "Sent email to verify participant's email address."))
        .catch(utils.failureHandler(this.failureParams));
    });
  }
  resendPhoneVerification(vm, event) {
    alerts.confirmation("This will send an SMS message to this user.\n\nDo you wish to continue?", () => {
      utils.startHandler(vm, event);
      this.resendAccountPhoneVerification()
        .then(utils.successHandler(vm, event, "Sent message to verify participant's phone number."))
        .catch(utils.failureHandler(this.failureParams));
    });
  }
  updateSynapseUserId(account) {
    let value = this.synapseUserIdObs();
    if (value === '' || /^\d+$/.test(value)) {
      return Promise.resolve();
    }
    return utils.synapseAliasToUserId(value).then((id) => {
      account.synapseUserId = id;
      this.synapseUserIdObs(id);
    });
  }
  updateAllStudiesObs() {
    return serverService.getStudies(false).then(response => {
      this.allStudiesObs(response.items.map(studyToOptions));
    });
  }
  save(vm, event) {
    this.account = this.binder.persist(this.account);

    utils.startHandler(vm, event);
    return this.updateSynapseUserId(this.account)
      .then(this.saveAccount.bind(this))
      .then(utils.successHandler(vm, event, "Participant updated."))
      .catch(utils.failureHandler(this.failureParams));
  }  
}
