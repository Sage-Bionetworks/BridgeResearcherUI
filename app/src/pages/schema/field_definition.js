import Binder from "../../binder";
import * as schemaUtils from "./schema_utils";

module.exports = function(params) {
  let self = this;
  let type = params.field.typeObs();

  self.field = params.field;
  new Binder(self).obs("focus", false).obs("extra", "none");
  schemaUtils.initFieldDefinitionVM(self, type);

  function updateExtraFields(type) {
    let typeInfo = schemaUtils.TYPE_LOOKUP[type];
    if (typeInfo) {
      self.extraObs(typeInfo.extra_fields);
    }
  }
  updateExtraFields(type);

  self.itemsObs = params.itemsObs;
  self.field.typeObs.subscribe(updateExtraFields);
  self.field.unboundedTextObs.subscribe(function(newValue) {
    if (newValue) {
      self.field.maxLengthObs("");
    } else {
      // let the field enable before trying to focus it.
      setTimeout(function() {
        self.focusObs(true);
      }, 1);
    }
  });
  self.updateExt = function(vm, event, object) {
    self.field.fileExtensionObs(object.ext);
  };
};
