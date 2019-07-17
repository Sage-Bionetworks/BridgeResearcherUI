import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

/**
 * params:
 *  selectOne: allow selection of only one element
 *  allowMostRecent: boolean to clear most createdOn
 *  addSchemas: function to receive selected schemas(s)
 *  selected: schema list
 */
export default function(params) {
  let self = this;

  self.title = params.selectOne ? "Select Schema" : "Select Schemas";
  self.controlName = params.selectOne ? "ui-radio" : "ui-checkbox";
  self.cancel = root.closeDialog;

  function selectById(selSchemaId) {
    return function(item) {
      return item.id === selSchemaId;
    };
  }
  function selectByChecked(item) {
    return item.checkedObs();
  }

  self.select = function() {
    let filterFunc = params.selectOne ? 
      selectById($("input[type=radio]:checked").toArray()[0].id.substring(1)) : 
      selectByChecked;
    let schemas = self.itemsObs().filter(filterFunc);
    params.addSchemas(schemas);
  };

  tables.prepareTable(self, {
    name: "schema",
    type: "UploadSchema",
    refresh: load
  });

  function match(schema) {
    return params.selected.filter(function(selectedSchema) {
      return selectedSchema.id === schema.schemaId;
    })[0];
  }
  function schemaToView(schema) {
    let selectedSchema = match(schema);
    let checked = !!selectedSchema;
    selectedSchema = selectedSchema || {};
    return {
      id: selectedSchema.schemaId || schema.schemaId,
      name: selectedSchema.name || schema.name,
      revision: selectedSchema.revision || schema.revision,
      checkedObs: ko.observable(checked)
    };
  }

  function load() {
    serverService.getAllUploadSchemas()
      .then(fn.handleMap("items", schemaToView))
      .then(fn.handleSort("items", "name"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler());
  }
  load();
};
