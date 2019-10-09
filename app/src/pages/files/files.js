import "knockout-postbox";
import fn from "../../functions";
import ko from "knockout";
import Promise from "bluebird";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function files() {
  let self = this;
  self.query = {}; // capture this for when the *parent* wants to refresh the page

  fn.copyProps(self, root, "isDeveloper", "isAdmin");
  self.showDeletedObs = ko.observable(false);

  // capture post-processing of the pager control
  self.postLoadPagerFunc = () => {};
  self.postLoadFunc = function(func) {
    self.postLoadPagerFunc = func;
  }

  tables.prepareTable(self, {
    name: "file",
    type: "File",
    refresh: () => load(self.query),
    delete: file => serverService.deleteFile(file.guid, false),
    deletePermanently: file => serverService.deleteFile(file.guid, true),
    undelete: file => serverService.updateFile(file.guid, file)
  });

  function load(query) {
    // some state is not in the pager, update that and capture last known state of paging
    query.includeDeleted = self.showDeletedObs();
    self.query = query;
    serverService.getFiles(query)
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .then(function(response) {
        return Promise.map(response.items, function(file) {
          file.deletedObs = ko.observable(file.deleted || false);
        });
      }).catch(utils.failureHandler());
  }
  ko.postbox.subscribe('f-refresh', load);
};
