import alerts from "../widgets/alerts";
import BaseAccount from "./base_account";
import fn from "../functions";
import ko from "knockout";
import Promise from "bluebird";
import root from "../root";
import serverService from "../services/server_service";
import tables from "../tables";
import utils from "../utils";

function loadStudy(enrollment) {
  return serverService.getStudy(enrollment.studyId)
    .then(study => enrollment.studyName = study.name)
    .then(() => enrollment); // change what is returned here back to the enrollment
}

export default class EnrollmentsBaseAccount extends BaseAccount {
  constructor(params) {
    super(params);
    this.subpopulations = [];

    fn.copyProps(this, fn, "formatDateTime", "formatNameAsFullLabel");

    tables.prepareTable(this, { 
      name: "enrollment",
      id: this.failureParams.id
    });

    this.getAccount()
      .then(account => this.account = account)
      .then(() => serverService.getAllSubpopulations(true))
      .then(response => this.subpopulations = response.items)
      .then(() => this.getEnrollments())
      .catch(utils.failureHandler(this.failureParams));
  }
  loadEnrollments() { 
    throw new Error('loadEnrollments not implemented');
  }
  getEnrollments() {
    this.loadEnrollments()
      .then(res => Promise.all(res.items.map(loadStudy))
      .then(res => this.itemsObs(res)))
      .catch(utils.failureHandler(this.failureParams));
  }
  hasSignatures(item) {
    if (!this.account || !this.account.consentHistories) {
      return false;
    }
    return this.subpopulations.some(subpop => {
      let array = this.account.consentHistories[subpop.guid];
      return subpop.studyIdsAssignedOnConsent.includes(item.studyId) && array && array.length;
    });
  }
  withdraw() {
    root.openDialog("withdrawal", {
      userId: this.userId, vm: this, closeMethod: "finishWithdrawal"
    });
  }
  finishWithdrawal(reasonString) {
    let reason = reasonString ? { reason: reasonString } : {};
    serverService.withdrawParticipantFromApp(this.userId, reason)
      .then(root.closeDialog)
      .then(() => this.getEnrollments())
      .then(utils.successHandler(this, null, "User has been withdrawn from all studies in the app."))
      .catch(utils.failureHandler(this.failureParams));
  }
  enroll(item, event) {
    // knockout destroys the "this" binding. We can get it back with some magic
    let self = ko.contextFor(event.target).$component;
    alerts.optionalPrompt("Add an external ID to this enrollment (optional)?", (extId) => {
      utils.startHandler(self, event);
      serverService.enroll(item.studyId, item.participant.identifier, extId)
        .then(() => self.getEnrollments())
        .catch(utils.failureHandler(this.failureParams));
    });
  }
  unenroll(item, event) {
    // knockout destroys the "this" binding. We can get it back with some magic
    let self = ko.contextFor(event.target).$component;
    alerts.prompt("Why are you withdrawing this person?", (withdrawalNote) => {
      utils.startHandler(self, event);
      serverService.unenroll(item.studyId, item.participant.identifier, withdrawalNote)
        .then(utils.successHandler(self, event, "Participant removed from study."))
        .then(() => self.getEnrollments())
        .catch(utils.failureHandler(this.failureParams));
    });
  }
}
