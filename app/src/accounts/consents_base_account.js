import alerts from "../widgets/alerts";
import BaseAccount from "./base_account";
import Binder from "../binder";
import fn from "../functions";
import Promise from "bluebird";
import root from "../root";
import serverService from "../services/server_service";
import tables from "../tables";
import utils from "../utils";

let session = null;

serverService.addSessionStartListener((sess) => session = sess);
serverService.addSessionEndListener(() => session = null);

export default class ConsentsBaseAccount extends BaseAccount {
  constructor(params) {
    super(params);
    this.session = session;

    this.userId = params.userId;

    fn.copyProps(this, root, "isResearcher");
    new Binder(this)
      .obs("userId", params.userId)
      .obs("items[]")
      .obs("status")
      .obs('studyId', '...')
      .obs("title", "&#160;");
  
    tables.prepareTable(this, { 
      name: "consent signature",
      id: 'participant-consents',
      reload: this.load.bind(this)
    });
    this.getParticipantName().then((part) => {
        this.titleObs(part.name);
        this.statusObs(part.status);
      }).then(() => serverService.getStudy(params.studyId))
      .then(study => this.studyIdObs(study.name))
      .then(this.load.bind(this))
      .catch(utils.failureHandler(this.failureParams));
  }
  getParticipantName() {
    throw new Error('getParticipantName not implemented');
  }
  resendConsentAgreement(subpopGuid) {
    throw new Error('resendConsentAgreement not implemented');
  }
  withdrawParticipantFromApp(reason) {
    throw new Error('withdrawParticipantFromApp not implemented');
  }
  withdrawParticipantFromSubpopulation(subpopGuid, reason) {
    throw new Error('withdrawParticipantFromSubpopulation not implemented');
  }
  getParticipant() { 
    throw new Error('getParticipant not implemented');
  }
  linkToDocument(data) {
    throw new Error('getParticipant not implemented');
  }
  getSubpopulation(guid) {
    return serverService.getSubpopulation(guid);
  }
  resendConsent(vm, event) {
    let subpopGuid = vm.consentURL.split("/subpopulations/")[1].split("/consents/")[0];
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
      utils.startHandler(vm, event);
      this.resendConsentAgreement(subpopGuid)
        .then(utils.successHandler(vm, event, "Resent consent agreement."))
        .catch(utils.failureHandler(this.failureParams));
    });
  }
  withdraw(vm, event) {
    root.openDialog("withdrawal", {
      userId: this.userId,
      vm: this,
      closeMethod: "finishWithdrawal"
    });
  }
  finishWithdrawal(reasonString) {
    let reason = reasonString ? { reason: reasonString } : {};
    this.withdrawParticipantFromApp(reason)
      .then(root.closeDialog)
      .then(this.load.bind(this))
      .then(utils.successHandler(this, null, 
          "User has been withdrawn from all studies in the app."))
      .catch(utils.failureHandler(this.failureParams));
  }
  withdrawFromSubpopulation(model, event) {
    root.openDialog("withdrawal", {
      userId: this.userId,
      vm: this,
      closeMethod: "finishSubpopWithdrawal",
      subpopGuid: model.subpopulationGuid
    });
  }
  finishSubpopWithdrawal(reasonString, subpopGuid) {
    let reason = reasonString ? { reason: reasonString } : {};
    this.withdrawParticipantFromSubpopulation(subpopGuid, reason)
      .then(root.closeDialog)
      .then(this.load.bind(this))
      .then(utils.successHandler(this, null, "User has been withdrawn from this consent group."))
      .catch(utils.failureHandler(this.failureParams));
  }
  isUpToDateConsent(item) {
    return item.consented && item.isFirst && item.hasSignedActiveConsent;
  }
  // easily the most ridiculous method in this app
  load() {
    this.getParticipant().then((response) => {
      let histories = response.consentHistories;

      return Promise.map(Object.keys(histories), (guid) => {
        return this.getSubpopulation(guid);
      }).then((subpopulations) => {
        return subpopulations.filter(subpop => subpop.studyIdsAssignedOnConsent.includes(this.studyId))
      }).then((subpopulations) => {
        if (subpopulations.length === 0) {
          this.itemsObs([]);
        }
        subpopulations.forEach((subpop) => {
          if (histories[subpop.guid].length === 0) {
            this.itemsObs.push({
              consentGroupName: subpop.name,
              name: "No consent",
              consented: false,
              eligibleToWithdraw: false
            });
          }
          histories[subpop.guid].reverse().map((record, i) => {
            let history = { consented: true, isFirst: i === 0 };
            history.consentGroupName = subpop.name;
            history.consentURL = "/subpopulations/" + subpop.guid + "/consents/" + record.consentCreatedOn;
            history.subpopulationGuid = subpop.guid;
            history.subpopulationGuidIndex = i;
            history.name = record.name;
            history.birthdate = fn.formatDateTime(record.birthdate);
            history.signedOn = fn.formatDateTime(record.signedOn);
            history.consentCreatedOn = fn.formatDateTime(record.consentCreatedOn);
            history.hasSignedActiveConsent = record.hasSignedActiveConsent;
            if (record.withdrewOn) {
              history.withdrewOn = fn.formatDateTime(record.withdrewOn);
            } else {
              history.eligibleToWithdraw = true;
            }
            if (record.imageMimeType && record.imageData) {
              history.imageData = "data:" + record.imageMimeType + ";base64," + record.imageData;
            }
            this.itemsObs.push(history);
          });
        });
      }).then(utils.successHandler())
      .catch(utils.failureHandler(this.failureParams));
    }).catch(utils.failureHandler(this.failureParams));
  }
}