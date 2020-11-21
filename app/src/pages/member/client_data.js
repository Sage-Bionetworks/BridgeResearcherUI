import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found",
  id: 'mem-client-data'
});

export default function clientData(params) {
  let self = this;
  self.participant = null;
  self.orgId = params.orgId;

  const binder  = new Binder(self)
    .obs("userId", params.userId)
    .obs("title", "&#160;")
    .obs("guid", params.guid)
    .obs("startDate")
    .obs("endDate")
    .obs("status")
    .obs("clientData")
    .obs("warn", false)
    .obs("orgId", params.orgId)
    .obs("orgName");

  function setClientData(response) {
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
      utils.failureHandler({ transient: false, id: 'mem-client-data' })(error);
      return false;
    }
    return true;
  }

  self.save = function(vm, event) {
    utils.clearErrors();
    if (!updateClientData()) {
      return;
    }
    utils.startHandler(vm, event);
    serverService.updateOrgMember(params.orgId, self.participant)
      .then(utils.successHandler(vm, event, "Client data updated."))
      .catch(utils.failureHandler({ id: 'mem-client-data' }));
  };
  self.reformat = function(vm, event) {
    utils.clearErrors();
    updateClientData();
  };

  optionsService.getOrganizationNames()
    .then(fn.handleObsUpdate(self.orgNameObs, params.orgId))
    .then(() => serverService.getOrgMemberName(params.orgId, params.userId))
    .then(fn.handleObsUpdate(self.titleObs, "name"))
    .then(fn.handleObsUpdate(self.statusObs, "status"))
    .then(() => serverService.getOrgMember(params.orgId, params.userId))
    .then(binder.assign('participant'))
    .then(response => setClientData(response))
    .catch(failureHandler);
};
