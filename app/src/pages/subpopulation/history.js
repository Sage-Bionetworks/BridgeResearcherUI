import { serverService } from "../../services/server_service";
import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import utils from "../../utils";
import ko from "knockout";

const failureHandler = utils.failureHandler({
  redirectMsg: "Consent group not found.",
  redirectTo: "subpopulations"
});

module.exports = function(params) {
  let self = this;

  let binder = new Binder(self)
    .obs("historyItems[]")
    .obs("guid", params.guid)
    .obs("createdOn", params.createdOn || "recent")
    .obs("publishedConsentCreatedOn")
    .obs("name");

  fn.copyProps(self, fn, "formatDateTime");

  self.activeObs = ko.computed(function() {
    return self.createdOnObs() === self.publishedConsentCreatedOnObs();
  });

  self.publish = function(item, event) {
    alerts.confirmation("Are you sure you want to publish this consent?", function() {
      utils.startHandler(self, event);

      fn.copyProps(params, item, "subpopulationGuid->guid", "createdOn");
      serverService
        .publishStudyConsent(params.guid, params.createdOn)
        .then(load)
        .then(utils.successHandler(self, event, "Consent published"))
        .catch(failureHandler);
    });
  };

  function getHistory() {
    return serverService.getConsentHistory(params.guid);
  }
  function addActiveFlag(item) {
    item.active = self.publishedConsentCreatedOnObs() === item.createdOn;
  }

  function load() {
    return serverService
      .getSubpopulation(params.guid)
      .then(binder.update())
      .then(getHistory)
      .then(fn.handleForEach("items", addActiveFlag))
      .then(fn.handleObsUpdate(self.historyItemsObs, "items"))
      .catch(failureHandler);
  }
  load();
};
