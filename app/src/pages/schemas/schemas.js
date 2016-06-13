var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');
var root = require('../../root');
var tables = require('../../tables');

module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);

    tables.prepareTable(self, "schema", "#/schemas", function(schema) {
        return serverService.deleteSchema(schema.schemaId);
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