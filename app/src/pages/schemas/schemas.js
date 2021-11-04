import * as schemaUtils from "../schema/schema_utils";
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import sharedModuleUtils from "../../shared_module_utils";
import tables from "../../tables";
import utils from "../../utils";

export default function schemas() {
  let self = this;

  schemaUtils.initSchemasVM(self);
  fn.copyProps(self, root, "isAdmin", "isDeveloper");
  fn.copyProps(self, sharedModuleUtils, "formatModuleLink");
  fn.copyProps(self, criteriaUtils, "label");

  tables.prepareTable(self, {
    name: "schemas",
    type: "UploadSchema",
    id: 'schemas',
    refresh: load,
    delete: (item) => serverService.deleteSchema(item.schemaId, false),
    deletePermanently: (item) => serverService.deleteSchema(item.schemaId, true),
    undelete: (item) => serverService.updateUploadSchema(item)
  });

  function closeCopySchemasDialog() {
    root.closeDialog();
    load().then(utils.successHandler(self, null, "Schemas copied"));
  }
  self.copySchemasDialog = function(vm, event) {
    let copyables = self.itemsObs().filter(tables.hasBeenChecked);
    root.openDialog("copy_schemas", {
      copyables: copyables,
      closeCopySchemasDialog: closeCopySchemasDialog
    });
  };
  self.openModuleBrowser = function() {
    root.openDialog("module_browser", {
      type: "schema",
      closeModuleBrowser: self.closeModuleBrowser
    });
  };
  self.closeModuleBrowser = function() {
    root.closeDialog();
    load();
  };

  function load() {
    return sharedModuleUtils
      .loadNameMaps()
      .then(() => serverService.getAllUploadSchemas(self.showDeletedObs()))
      .then(fn.handleSort("items", "name"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({ id: 'schemas' }));
  }
  load();
};
