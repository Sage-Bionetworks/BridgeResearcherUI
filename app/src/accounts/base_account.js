import Binder from "../binder";
import fn from "../functions";
import ko from "knockout";
import root from "../root";
import serverService from "../services/server_service";
import utils from "../utils";

const ACCOUNT = { id: "new", attributes: {}, email: "" };

export default class BaseAccount {
  constructor(params = {}) {
    this.failureParams = { id: params.errorId, transient: false };

    this.userId = params.userId;
    this.studyId = params.studyId;
    this.orgId = params.orgId;
    this.account = ACCOUNT;
    Object.keys(params).forEach(key => this[key] = params[key]);
    fn.copyProps(this, root, "isDeveloper", "isResearcher", "isAdmin");

    this.binder = new Binder(this)
      .bind("status")
      .bind("sharingScope")
      .bind("attributes[]", [], Binder.formatAttributes, Binder.persistAttributes)
      .bind("dataGroups[]", [])
      .obs("isNew", params.userId === "new")
      .obs("userId", params.userId)
      .obs("guid", params.guid)
      .obs("orgId", params.orgId) // this is for member screens, unused otherwise
      .obs("navStudyId", params.studyId) // this is for study-specific participant nav
      .obs("navStudyName") // this is for study-specific participant nav
      .obs("title", "&#160;")
      .obs('allDataGroups[]');

    serverService.getApp().then(app => {
      // there's a timer in the control involved here, we need to use an observer
      this.allDataGroupsObs(app.dataGroups || []);
      let attrs = app.userProfileAttributes.map(function(key) {
        return { key: key, label: key, obs: ko.observable() };
      });
      this.attributesObs(attrs);
    });
  }
  saveAccount() {
    if (!this.isNewObs()) {
      this.titleObs(fn.formatNameAsFullLabel(this.account, this.studyId));
    }
    let promise = this.isNewObs() ? this.createAccount() : this.updateAccount();
    return promise.then(this.afterCreate.bind(this));
  }
  afterCreate(res) {
    if (res.identifier) { // IdentifierHolder (created)
      this.isNewObs(false);
      this.idObs(id);
      this.userIdObs(id);
      this.userId = id;
    } else { // StatusMessage (updated)
      this.statusObs("enabled");
    }
    return res;
  }
  getAccount() {
    if (this.isNewObs()) {
      return Promise.resolve(ACCOUNT);
    }
    return this.loadAccount().then(res => {
      let name = fn.formatNameAsFullLabel(res, this.studyId);
      this.titleObs(name);
      this.sharingScopeObs(res.sharingScope);
      this.statusObs(res.status);
      this.dataGroupsObs(res.dataGroups);
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
