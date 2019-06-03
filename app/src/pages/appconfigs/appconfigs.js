import { serverService } from "../../services/server_service";
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import Promise from "bluebird";
import scheduleUtils from "../schedule/schedule_utils";
import tables from "../../tables";
import utils from "../../utils";

export default function() {
  let self = this;

  tables.prepareTable(self, {
    name: "app config",
    refresh: load,
    delete: function(item) {
      return serverService.deleteAppConfig(item.guid, false);
    },
    deletePermanently: function(item) {
      return serverService.deleteAppConfig(item.guid, true);
    },
    undelete: function(item) {
      return serverService.updateAppConfig(item);
    }
  });

  fn.copyProps(self, criteriaUtils, "label->criteriaLabel");
  fn.copyProps(self, scheduleUtils, "formatCompoundActivity");
  fn.copyProps(self, fn, "formatDateTime");

  self.copyItems = function(vm, event) {
    let copyables = this.itemsObs().filter(tables.hasBeenChecked);
    let confirmMsg = copyables.length > 1 ? "App configs have been copied." : "App config has been copied.";

    utils.startHandler(vm, event);
    Promise.mapSeries(copyables, function(appConfig) {
      let copy = JSON.parse(JSON.stringify(appConfig));
      delete copy.createdOn;
      delete copy.modifiedOn;
      delete copy.guid;
      delete copy.version;
      copy.criteria = copy.criteria || {};
      copy.criteria.minAppVersions = copy.criteria.minAppVersions || {};
      copy.criteria.minAppVersions["iPhone OS"] = 1000;
      copy.criteria.minAppVersions.Android = 1000;
      copy.label += " (Copy)";
      return serverService.createAppConfig(copy);
    })
      .then(load.bind(self))
      .then(utils.successHandler(vm, event, confirmMsg))
      .catch(utils.failureHandler({ transient: false }));
  };

  function getAppConfigs() {
    return serverService.getAppConfigs(self.showDeletedObs());
  }

  function load() {
    scheduleUtils
      .loadOptions()
      .then(getAppConfigs)
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler());
  }
  load();
};
