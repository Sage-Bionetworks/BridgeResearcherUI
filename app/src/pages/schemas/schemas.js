var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');
var root = require('../../root');
var tables = require('../../tables');

function deleteItem(schema) {
    return serverService.deleteSchema(schema.schemaId);
}

module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);

    self.isAdmin = root.isAdmin;
    
    tables.prepareTable(self, {
        name: "schema", 
        type: "UploadSchema",
        delete: deleteItem,
        refresh: load
    });

    function closeCopySchemasDialog() {
        root.closeDialog();
        root.message('success', 'Schemas copied');
        load();
    }
    self.copySchemasDialog = function(vm, event) {
        var copyables = self.itemsObs().filter(tables.hasBeenChecked);
        root.openDialog('copy_schemas', {copyables: copyables, closeCopySchemasDialog: closeCopySchemasDialog});
    };

    function load() {
        serverService.getAllUploadSchemas().then(function(response) {
            self.itemsObs(response.items.sort(utils.makeFieldSorter("name")));
        });
    }
    load();
};