import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found",
  id: 'studyparticipant-client-data'
});

export default function clientData(params) {
  let self = this;
  self.participant = null;
  fn.copyProps(self, root, "isResearcher");

  new Binder(self)
    .obs("userId", params.userId)
    .obs("title", "&#160;")
    .obs("guid", params.guid)
    .obs("startDate")
    .obs("endDate")
    .obs("status")
    .obs("clientData")
    .obs("warn", false)
    .bind("navStudyId", params.studyId)
    .bind("navStudyName");

  serverService.getParticipantName(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.statusObs(part.status);
    })
    .catch(failureHandler);

  serverService.getStudyParticipant(params.studyId, params.userId).then(setClientData);

  function setClientData(response) {
    self.participant = response;
    if (response.clientData) {
      self.clientDataObs(jsonFormatter.prettyPrint(response.clientData));
    } else {
      self.clientDataObs("");
    }
  }
  function updateClientData() {
    try {
      if (self.clientDataObs()) {
        self.participant.clientData = JSON.parse(self.clientDataObs());
        self.clientDataObs(jsonFormatter.prettyPrint(self.participant.clientData));
      } else {
        delete self.participant.clientData;
      }
    } catch (e) {
      let error = new BridgeError();
      error.addError("clientData", "is not valid JSON");
      utils.failureHandler({ transient: false, id: 'studyparticipant-client-data' })(error);
      return false;
    }
    return true;
  }

  serverService.getStudy(params.studyId).then((response) => {
    self.navStudyNameObs(response.name);
  });

  self.save = function(vm, event) {
    utils.clearErrors();
    if (!updateClientData()) {
      return;
    }
    utils.startHandler(vm, event);
    serverService.updateStudyParticipant(params.studyId, self.participant)
      .then(utils.successHandler(vm, event, "Client data updated."))
      .catch(utils.failureHandler({ id: 'studyparticipant-client-data' }));
  };
  self.reformat = function(vm, event) {
    utils.clearErrors();
    updateClientData();
  };
};
