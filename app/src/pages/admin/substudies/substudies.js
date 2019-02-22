import { serverService } from "../../../services/server_service";
import fn from "../../../functions";
import tables from "../../../tables";
import utils from "../../../utils";

module.exports = function() {
  let self = this;

  tables.prepareTable(self, {
    name: "substudy",
    plural: "substudies",
    refresh: load,
    delete: function(item) {
      return serverService.deleteSubstudy(item.id, false);
    },
    deletePermanently: function(item) {
      return serverService.deleteSubstudy(item.id, true);
    },
    undelete: function(item) {
      return serverService.updateSubstudy(item);
    }
  });

  function getSubstudies() {
    return serverService.getSubstudies(self.showDeletedObs());
  }

  function load() {
    return getSubstudies()
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler());
  }
  load();
};
