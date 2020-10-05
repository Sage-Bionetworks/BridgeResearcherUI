import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import Promise from "bluebird";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found",
  id: 'participant-enrollments'
});

export default function consents(params) {
  let self = this;
  fn.copyProps(self, root, "isResearcher");
  fn.copyProps(self, fn, "formatDateTime", "formatNameAsFullLabel");
  
  new Binder(self)
    .obs("userId", params.userId)
    .obs("items[]")
    .obs("status")
    .obs("noConsent", true)
    .obs("title", "&#160;");

  tables.prepareTable(self, { 
    name: "enrollment",
    id: 'participant-enrollments'
  });

  self.withdraw = function(vm, event) {
    root.openDialog("withdrawal", {
      userId: params.userId,
      vm: self,
      closeMethod: "finishWithdrawal"
    });
  };
  self.finishWithdrawal = function(reasonString) {
    let reason = reasonString ? { reason: reasonString } : {};
    serverService.withdrawParticipantFromApp(params.userId, reason)
      .then(root.closeDialog)
      .then(load)
      .then(utils.successHandler(self, null, "User has been withdrawn from all studies in the app."))
      .catch(failureHandler);
  };
  self.enroll = (item, event) => {
    alerts.optionalPrompt("Add an external ID to this enrollment (optional)?", (extId) => {
      utils.startHandler(self, event);
      serverService.enroll(item.studyId, item.participant.identifier, extId)
        .then(load)
        .catch(utils.failureHandler({ id: 'enrollments' }));
    });
  };
  self.unenroll = (item, event) => {
    alerts.prompt("Why are you withdrawing this person?", (withdrawalNote) => {
      utils.startHandler(self, event);
      serverService.unenroll(item.studyId, item.participant.identifier, withdrawalNote)
        .then(utils.successHandler(self, event, "Participant removed from study."))
        .then(load)
        .catch(utils.failureHandler({ id: 'enrollments' }));
    });
  };

  function loadStudy(enrollment) {
    return serverService.getStudy(enrollment.studyId).then((study) => enrollment.studyName = study.name);
  }

  function load() {
    serverService.getParticipantName(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.statusObs(part.status);
    })
    .then(() => serverService.getParticipantEnrollments(params.userId))
    .then(response => {
      return Promise.all(response.map(loadStudy)).then(() => self.itemsObs(response));
    })
    .catch(failureHandler);
  }
  load();
};
