import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

/**
 * params:
 *  selectOne: allow selection of only one element
 *  addConfigs: function to receive selected schemas(s)
 *  selected: config list
 */
export default function(params) {
  let self = this;

  self.cancel = root.closeDialog;

  function selectByChecked(item) {
    return item.checkedObs();
  }

  self.select = function() {
    let files = self.itemsObs().filter(selectByChecked);
    params.addFiles(files);
  };

  tables.prepareTable(self, {
    name: "file",
    type: "File",
    id: "select-files",
    refresh: load
  });

  function match(file) {
    return params.selected.filter((selectedFile) => selectedFile.guid === file.guid)[0];
  }
  function configToView(file) {
    let selectedFile = match(file);
    let checked = !!selectedFile;
    selectedFile = selectedFile || {};
    return {
      guid: selectedFile.guid || file.guid,
      name: selectedFile.name || file.name,
      createdOn: selectedFile.createdOn || file.createdOn,
      checkedObs: ko.observable(checked)
    };
  }

  function load() {
    serverService.getFiles()
      .then(fn.handleMap("items", configToView))
      .then(fn.handleSort("items", "id"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler());
  }
  load();
};
