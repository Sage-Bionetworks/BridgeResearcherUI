import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

export default function fileRevisions(params) {
  let self = this;
  self.query = {}; // capture this for when the *parent* wants to refresh the page

  self.formatDateTime = fn.formatDateTime;

  // capture post-processing of the pager control
  self.postLoadPagerFunc = () => {};
  self.postLoadFunc = function(func) {
    self.postLoadPagerFunc = func;
  }
  
  tables.prepareTable(self, {
    name: "file revisions",
    type: "File Revisions",
    refresh: () => load(self.query)
  });

  self.isNewObs = ko.observable(false);
  self.guidObs = ko.observable(params.guid);
  self.titleObs = ko.observable("Test");

  self.newRevisionDialog = function(vm, event) {
    root.openDialog("file_upload", {
      closeFunc: root.closeDialog,
      guid: params.guid
    });
  };

  function load(query) {
    // some state is not in the pager, update that and capture last known state of paging
    self.query = query;

    serverService.getFile(params.guid)
      .then(fn.handleObsUpdate(self.titleObs, "name"))
      .then(() => serverService.getFileRevisions(params.guid, query))
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler());
  }
  ko.postbox.subscribe('fr-refresh', load);  
};
