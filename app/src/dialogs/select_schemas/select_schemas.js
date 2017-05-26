var serverService = require('../../services/server_service');
var root = require('../../root');
var utils = require('../../utils');
var tables = require('../../tables');
var fn = require('../../functions');

/**
 * params:
 *  selectOne: allow selection of only one element
 *  allowMostRecent: boolean to clear most createdOn 
 *  addSchemas: function to receive selected schemas(s)
 *  selected: schema list
 */
module.exports = function(params) {
    var self = this;

    self.title = params.selectOne ? 'Select Schema' : 'Select Schemas';
    self.controlName = params.selectOne ? 'ui-radio' : 'ui-checkbox';
    self.cancel = root.closeDialog;
    
    function selectById(selSchemaId)  {
        return function(item) {
            return item.id === selSchemaId;
        };
    }
    function selectByChecked(item) {
        return item.checkedObs();
    }

    self.select = function() {
        var filterFunc = (params.selectOne) ?
            selectById($("input[type=radio]:checked").toArray()[0].id.substring(1)) :
            selectByChecked;
        var schemas = self.itemsObs().filter(filterFunc);
        params.addSchemas(schemas);
    };

    tables.prepareTable(self, {
        name: "schema",
        type: "UploadSchema",
        refresh: load
    });

    function match(schema) {
        return params.selected.filter(function(selectedSchema) {
            return (selectedSchema.id === schema.schemaId);
        })[0];
    }
    // TODO: This is not used anywhere.... ? Test this.
    // Same with surveys... did I change this behavior and not remove these?
    function schemaToView(schema) {
        var selectedSchema = match(schema);
        var obj = {
            id: schema.schemaId, 
            name: schema.name, 
            checkedObs: ko.observable(!!selectedSchema)
        };
        if (params.allowMostRecent && selectedSchema) {
            obj.revision = selectedSchema.revision;
        } else if (!params.allowMostRecent) {
            obj.revision = schema.revision;
        }
        return obj;
    }

    function load() { 
        serverService.getAllUploadSchemas()
            .then(fn.handleMap('items', schemaToView))
            .then(fn.handleSort('items','name'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};
