var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var sharedModuleUtils = require('../../shared_module_utils');
var criteriaUtils = require('../../criteria_utils');
var utils = require('../../utils');
var root = require('../../root');
var tables = require('../../tables');
var fn = require('../../functions');

function deleteItem(schema) {
    return serverService.deleteSchema(schema.schemaId);
}

module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);

    self.criteriaLabel = criteriaUtils.label;
    self.isAdmin = root.isAdmin;
    self.isDeveloper = root.isDeveloper;
    self.formatModuleLink = sharedModuleUtils.formatModuleLink;
    self.moduleHTML = sharedModuleUtils.moduleHTML;
    
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
    self.openModuleBrowser = function() {
        root.openDialog('module_browser', {
            type: 'schema', closeModuleBrowser: 
            self.closeModuleBrowser
        });
    };
    self.closeModuleBrowser = function() {
        root.closeDialog();
        load();
    };

    function load() {
        sharedModuleUtils.loadNameMaps()
            .then(serverService.getAllUploadSchemas)
            .then(function(response) {
                self.itemsObs(response.items.sort(fn.makeFieldSorter("name")));
            });
    }
    load();
};