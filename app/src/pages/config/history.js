import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectMsg: "Config element not found.",
  redirectTo: "configs",
  transient: false,
  id: 'config-el-history'
});

export default function history(params) {
  let self = this;

  fn.copyProps(self, root, "isAdmin");
  fn.copyProps(self, fn, "formatDateTime");

  new Binder(self)
    .obs("title", params.id)
    .obs("isNew", false)
    .obs("id", params.id)
    .obs("revision", params.revision);

  tables.prepareTable(self, {
    name: "configuration element revision",
    refresh: load,
    id: "config-el-history",
    redirect: "/configs",
    delete: (item) => serverService.deleteAppConfigElementRevision(item.id, item.revision, false),
    deletePermanently: (item) => serverService.deleteAppConfigElementRevision(item.id, item.revision, true),
    undelete: (item) => serverService.updateAppConfigElement(item)
  });

  function load() {
    serverService
      .getAppConfigElement(params.id, params.revision)
      .then(() => serverService.getAppConfigElementRevisions(params.id, self.showDeletedObs()))
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(failureHandler);
  }
  load();
};
