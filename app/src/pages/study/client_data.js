import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import jsonFormatter from "../../json_formatter";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;

  var binder = new Binder(self)
    .obs("name")
    .obs("identifier")
    .obs("isNew", false)
    .obs("clientData");

  self.save = function(vm, event) {
    utils.clearErrors();
    if (!updateClientData()) {
      return;
    }
    utils.startHandler(vm, event);
    serverService.updateStudy(self.study)
      .then(res => self.study.version = res.version)
      .then(utils.successHandler(vm, event, "Study updated."))
      .catch(utils.failureHandler({id: 'study-client-data' }));
  }

  self.reformat = function() {
    utils.clearErrors();
    updateClientData();
  }

  function updateClientData() {
    try {
      if (self.clientDataObs()) {
        self.study.clientData = JSON.parse(self.clientDataObs());
        self.clientDataObs(jsonFormatter.prettyPrint(self.study.clientData));
      } else {
        delete self.study.clientData;
      }
    } catch (e) {
      let error = new BridgeError();
      error.addError("clientData", "is not valid JSON");
      utils.failureHandler({ id: 'study-client-data', transient: false })(error);
      return false;
    }
    return true;    
  }

  function setClientData(study) {
    if (study.clientData) {
      self.clientDataObs(jsonFormatter.prettyPrint(study.clientData));
    } else {
      self.clientDataObs("{}");
    }
  }

  serverService.getStudy(params.studyId)
    .then(binder.assign('study'))
    .then(binder.update())
    .then(setClientData);
};
