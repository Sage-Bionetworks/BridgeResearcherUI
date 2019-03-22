import { serverService } from "../../services/server_service";
import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import Promise from "bluebird";
import root from "../../root";
import tables from "../../tables";
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found"
});

let session = null;

serverService.addSessionStartListener(function(sess) {
  session = sess;
});
serverService.addSessionEndListener(function() {
  session = null;
});

module.exports = function(params) {
  let self = this;

  new Binder(self)
    .obs("userId", params.userId)
    .obs("items[]")
    .obs("noConsent", true)
    .obs("status")
    .obs("title", "&#160;");

  tables.prepareTable(self, { name: "consent" });

  serverService
    .getParticipantName(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.statusObs(part.status);
    })
    .catch(failureHandler);

  self.resendConsent = function(vm, event) {
    let subpopGuid = vm.consentURL.split("/subpopulations/")[1].split("/consents/")[0];
    alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
      utils.startHandler(vm, event);
      serverService
        .resendConsentAgreement(params.userId, subpopGuid)
        .then(utils.successHandler(vm, event, "Resent consent agreement."))
        .catch(failureHandler);
    });
  };
  self.withdraw = function(vm, event) {
    root.openDialog("withdrawal", {
      userId: params.userId,
      vm: self,
      closeMethod: "finishWithdrawal"
    });
  };
  self.finishWithdrawal = function(reasonString) {
    let reason = reasonString ? { reason: reasonString } : {};
    serverService
      .withdrawParticipantFromStudy(params.userId, reason)
      .then(root.closeDialog)
      .then(load)
      .then(utils.successHandler(self, null, "User has been withdrawn from the study."))
      .catch(failureHandler);
  };
  self.withdrawFromSubpopulation = function(model, event) {
    root.openDialog("withdrawal", {
      userId: params.userId,
      vm: self,
      closeMethod: "finishSubpopWithdrawal",
      subpopGuid: model.subpopulationGuid
    });
  };
  self.finishSubpopWithdrawal = function(reasonString, subpopGuid) {
    let reason = reasonString ? { reason: reasonString } : {};
    serverService
      .withdrawParticipantFromSubpopulation(params.userId, subpopGuid, reason)
      .then(root.closeDialog)
      .then(load)
      .then(utils.successHandler(self, null, "User has been withdrawn from this consent group."))
      .catch(failureHandler);
  };
  self.linkToDocument = function($data) {
    let query = fn.queryString({
      userId: self.userIdObs(),
      index: $data.subpopulationGuidIndex,
      guid: $data.subpopulationGuid,
      host: session.host
    });
    return "/consent/consent.html" + query;
  };
  self.isUpToDateConsent = function(item) {
    return item.consented && item.isFirst && item.hasSignedActiveConsent;
  };

  // I know, ridiculous...
  function load() {
    self.itemsObs([]);
    self.recordsMessageObs("<div class='ui tiny active inline loader'></div>");
    serverService
      .getParticipant(self.userIdObs())
      .then(function(response) {
        let histories = response.consentHistories;

        return Promise.map(Object.keys(histories), function(guid) {
          return serverService.getSubpopulation(guid);
        }).then(function(subpopulations) {
          subpopulations.forEach(function(subpop) {
            if (histories[subpop.guid].length === 0) {
              self.itemsObs.push({
                consentGroupName: subpop.name,
                name: "No consent",
                consented: false,
                eligibleToWithdraw: false
              });
            }
            histories[subpop.guid].reverse().map(function(record, i) {
              let history = { consented: true, isFirst: i === 0 };
              history.consentGroupName = subpop.name;
              history.consentURL = "/#/subpopulations/" + subpop.guid + "/consents/" + record.consentCreatedOn;
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
                self.noConsentObs(false);
                history.eligibleToWithdraw = true;
              }
              if (record.imageMimeType && record.imageData) {
                history.imageData = "data:" + record.imageMimeType + ";base64," + record.imageData;
              }
              self.itemsObs.push(history);
            });
          });
        });
      })
      .catch(failureHandler);
  }
  load();
};
