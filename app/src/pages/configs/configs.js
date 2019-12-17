import fn from "../../functions";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function() {
  let self = this;
  fn.copyProps(self, fn, "formatDateTime");

  self.createLink = (config) => "#/configs/" + config.id + "/revisions/" + config.revision;

  tables.prepareTable(self, {
    name: "configuration element",
    refresh: load,
    id: "configs",
    delete: (item) => serverService.deleteAppConfigElement(item.id, false),
    deletePermanently: (item) => serverService.deleteAppConfigElement(item.id, true),
    undelete: (item) => serverService.updateAppConfigElement(item)
  });

  function load() {
    serverService.getAppConfigElements(self.showDeletedObs())
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({ id: 'configs' }));
  }
  load();
};
