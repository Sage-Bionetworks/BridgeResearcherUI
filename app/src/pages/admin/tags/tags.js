import fn from "../../../functions";
import serverService from "../../../services/server_service";
import tables from "../../../tables";

function deleteTag(item) {
  return serverService.deleteTag(item.name);
}

export default function() {
  let self = this;

  tables.prepareTable(self, {
    name: "tag",
    plural: "tags",
    delete: deleteTag,
    id: "tags",
    refresh: load
  });

  function load() {
    return serverService.getTags().then(response => {
      let array = [];
      Object.keys(response).forEach(ns => {
        let nsString = (ns === 'default') ? '' : (ns+":");
        response[ns].forEach(value => {
          array.push({name: nsString + value});
        });
      });
      return { items: array };
    })
    .then(fn.handleObsUpdate(self.itemsObs, "items"));
  }
  load();
};
