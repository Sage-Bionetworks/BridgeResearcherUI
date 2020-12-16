import Binder from "../binder";
import fn from "../functions";
import ko from "knockout";
import root from "../root";
import serverService from "../services/server_service";
import utils from "../utils";

const ACCOUNT = { id: "new", attributes: {}, email: "", phone: { number: "", regionCode: "US" } };

export default class BaseAccount {
  constructor(params = {}) {
    this.failureParams = { id: params.errorId };

    this.account = ACCOUNT;
    Object.keys(params).forEach(key => this[key] = params[key]);
    fn.copyProps(this, root, "isDeveloper", "isResearcher", "isAdmin");

    new Binder(this)
      .obs("isNew", params.userId === "new")
      .obs("userId", params.userId)
      .obs("guid", params.guid)
      .obs("orgId", params.orgId) // this is for member screens, unused otherwise
      .obs("navStudyId", params.studyId) // this is for study-specific participant nav
      .obs("navStudyName") // this is for study-specific participant nav
      .obs("title", "&#160;")
      .obs('allDataGroups[]')
      .bind("status")
      .bind("sharingScope")
      .bind("attributes[]", [], Binder.formatAttributes, Binder.persistAttributes);

    serverService.getApp().then(app => {
      // there's a timer in the control involved here, we need to use an observer
      this.allDataGroupsObs(app.dataGroups || []);
      let attrs = app.userProfileAttributes.map(function(key) {
        return { key: key, label: fn.formatTitleCase(key, ""), obs: ko.observable() };
      });
      this.attributesObs(attrs);
    });
  }
  saveAccount() {
    if (!this.isNewObs()) {
      this.titleObs(fn.formatNameAsFullLabel(this.account));
    }
    if (this.isNewObs()) {
      return this.createAccount()
        .then(this.afterCreate.bind(this))
        .then(utils.successHandler(this))
        .catch(utils.failureHandler(this.failureParams));
    } else {
      return this.updateAccount()
        .then(this.afterCreate.bind(this))
        .then(utils.successHandler(this))
        .catch(utils.failureHandler(this.failureParams));
    }
  }
  getAccount() {
    if (this.isNewObs()) {
      return Promise.resolve(ACCOUNT);
    }
    return this.loadAccount().then(res => {
      let name = fn.formatNameAsFullLabel(res);
      this.titleObs(name);
      this.sharingScopeObs(res.sharingScope);
      this.statusObs(res.status);
      return res;
    })
    .catch(utils.failureHandler({...this.failureParams, ...this.notFoundParams}));
  }
  loadAccount() {
    throw new Error('loadAccount not implemented');
  }
  createAccount() { 
    throw new Error('createAccount not implemented');
  }
  updateAccount() { 
    throw new Error('updateAccount not implemented');
  }
  deleteAccount() { 
    throw new Error('deleteAccount not implemented');
  }
  signOutAccount() {
    throw new Error('signOutAccount not implemented');
  }
  requestAccountResetPassword() {
    throw new Error('requestAccountResetPassword not implemented');
  }
  resendAccountEmailVerification() {
    throw new Error('resendAccountEmailVerification not implemented');
  }
  resendAccountPhoneVerification() {
    throw new Error('resendAccountPhoneVerification not implemented');
  }
}
