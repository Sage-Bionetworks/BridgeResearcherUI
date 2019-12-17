import fn from "../../../functions";
import serverService from "../../../services/server_service";
import tables from "../../../tables";
import utils from "../../../utils";

export default function() {
  let self = this;

  tables.prepareTable(self, {
    name: "substudy",
    plural: "substudies",
    id: "substudies",
    refresh: load,
    delete: (item) => serverService.deleteSubstudy(item.id, false),
    deletePermanently: (item) => serverService.deleteSubstudy(item.id, true),
    undelete: (item) => serverService.updateSubstudy(item)
  });

  function load() {
    return serverService.getSubstudies(self.showDeletedObs())
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({id: 'substudies'}));
  }
  load();
};
