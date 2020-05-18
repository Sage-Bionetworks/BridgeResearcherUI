import sharedModuleUtils from "../../shared_module_utils";
import fn from "../../functions";
import root from "../../root";

/**
 * params:
 *  importFunc - function to import this object into the app
 *  isImported - determine if object has been imported in this app (not the shared app)
 *  model - the shared module object
 */
export default function(params) {
  var self = this;

  self.importFunc = function(item, event) {
    params.importFunc(params.model, event);
  };
  fn.copyProps(self, params, "model", "isImported");
  fn.copyProps(self, root, "isAdmin");
  Object.assign(self, sharedModuleUtils);
};
