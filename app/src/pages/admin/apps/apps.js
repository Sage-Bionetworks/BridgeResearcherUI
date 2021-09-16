import fn from "../../../functions";
import serverService from "../../../services/server_service";
import tables from "../../../tables";


function enableApp(item) {
  item.active = true;
  return serverService.saveApp(item);
}
function fixDeleteFlag(res) {
  res.items.forEach(app => app.deleted = !app.active);
  return res;
}

export default function() {
  let self = this;

  tables.prepareTable(self, {
    name: "app",
    plural: "apps",
    delete: (item) => serverService.deleteApp(item.identifier, false),
    deletePermanently: (item) => serverService.deleteApp(item.identifier, true),
    undelete: enableApp,
    id: "apps",
    refresh: load
  });

  function load() {
    return serverService.getSession()
      .then(session => serverService.getApps(session.environment, self.showDeletedObs()))
      .then(fixDeleteFlag)
      .then(fn.handleObsUpdate(self.itemsObs, "items"));
  }
  load();
};
