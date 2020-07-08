import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function() {
  let self = this;

  fn.copyProps(self, root, "isAdmin");

  tables.prepareTable(self, {
    name: "study",
    plural: "studies",
    id: "studies",
    refresh: load,
    delete: (item) => serverService.deleteStudy(item.id, false),
    deletePermanently: (item) => serverService.deleteStudy(item.id, true),
    undelete: (item) => serverService.updateStudy(item)
  });

  function load() {
    return serverService.getStudies(self.showDeletedObs())
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({id: 'studies'}));
  }
  load();
};
