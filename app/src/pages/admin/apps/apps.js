import fn from "../../../functions";
import serverService from "../../../services/server_service";
import tables from "../../../tables";

function deleteApp(item) {
  if (item.identifier !== "api" && item.identifier !== "shared") {
    return serverService.deleteApp(item.identifier);
  } else {
    return Promise.resolve();
  }
}

export default function() {
  let self = this;

  tables.prepareTable(self, {
    name: "app",
    plural: "apps",
    delete: deleteApp,
    id: "apps",
    refresh: load
  });

  function load() {
    return serverService.getSession()
      .then((session) => serverService.getAppList(session.environment))
      .then(fn.handleObsUpdate(self.itemsObs, "items"));
  }
  load();
};
