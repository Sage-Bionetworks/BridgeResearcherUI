import fn from "../../../functions";
import ko from "knockout";
import serverService from "../../../services/server_service";
import tables from "../../../tables";
import utils from "../../../utils";

function mapKey(cacheKey) {
  return { key: cacheKey };
}
function deleteItem(item) {
  return serverService.deleteCacheKey(item.key);
}

export default function() {
  let self = this;

  self.signOutStatusObs = ko.observable();

  tables.prepareTable(self, {
    name: "cache key",
    delete: deleteItem,
    id: "cache",
    refresh: load
  });

  function load() {
    serverService.getCacheKeys()
      .then(function(response) {
        let items = response.map(mapKey);
        self.itemsObs(items.sort(fn.makeFieldSorter("key")));
      }).catch(utils.failureHandler({id: 'cache'}));
  }
  load();
};
