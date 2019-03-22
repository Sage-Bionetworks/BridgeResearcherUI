import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectMsg: "Config element not found.",
  redirectTo: "configs",
  transient: false
});

function newAppConfigElement() {
  return { id: "", revision: 1, data: {} };
}

module.exports = function(params) {
  let self = this;

  let binder = new Binder(self)
    .obs("isNew", params.id === "new")
    .obs("title", "New Configuration Element")
    .bind("id")
    .bind("revision")
    .bind("version")
    .bind("data", null, Binder.fromJson, Binder.toJson)
    .obs("createdOn")
    .obs("modifiedOn")
    .obs("schemaIndex")
    .obs("surveyIndex");

  let titleUpdated = fn.handleObsUpdate(self.titleObs, "id");
  fn.copyProps(self, fn, "formatDateTime");

  function saveConfigElement(identityChanged, configElement) {
    return identityChanged ? 
      serverService.createAppConfigElement(configElement) : 
      serverService.updateAppConfigElement(configElement);
  }
  function load() {
    if (self.isNewObs()) {
      return Promise.resolve(newAppConfigElement())
        .then(binder.assign("configElement"))
        .then(binder.update());
    } else {
      return serverService
        .getAppConfigElement(params.id, params.revision)
        .then(binder.assign("configElement"))
        .then(binder.update())
        .then(titleUpdated)
        .catch(failureHandler);
    }
  }
  function updateClientData() {
    if (self.dataObs()) {
      try {
        let json = JSON.parse(self.dataObs());
        self.dataObs(jsonFormatter.prettyPrint(json));
      } catch (e) {
        let error = new BridgeError();
        error.addError("data", "is not valid JSON");
        utils.failureHandler({ transient: false })(error);
        return true;
      }
    }
    return false;
  }
  function updateAfterPersist(response) {
    self.configElement.version = response.version;
    self.titleObs(self.idObs());
    self.isNewObs(false);
    self.modifiedOnObs(new Date());
    window.history.pushState({}, document.title, `#/configs/${self.idObs()}/revisions/${self.revisionObs()}/editor`);
  }

  self.save = function(vm, event) {
    if (updateClientData()) {
      return;
    }
    let identityChanged = self.configElement.id !== self.idObs() || self.configElement.revision !== self.revisionObs();
    self.configElement = binder.persist(self.configElement);

    utils.startHandler(vm, event);
    saveConfigElement(identityChanged, self.configElement)
      .then(updateAfterPersist)
      .then(utils.successHandler(vm, event, "Configuration element has been saved."))
      .catch(failureHandler);
  };
  self.reformat = function() {
    utils.clearErrors();
    updateClientData();
  };

  load();
};
