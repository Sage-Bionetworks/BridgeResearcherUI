import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import root from '../../root';
import schemaUtils from '../schema/schema_utils';
import serverService from '../../services/server_service';
import sharedModuleUtils from '../../shared_module_utils';
import tables from '../../tables';
import utils from '../../utils';

function deleteItem(schema) {
    return serverService.deleteSchema(schema.schemaId);
}
module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);
    fn.copyProps(self, root, 'isAdmin', 'isDeveloper');
    fn.copyProps(self, sharedModuleUtils, 'formatModuleLink', 'moduleHTML');
    fn.copyProps(self, criteriaUtils, 'label');
    
    tables.prepareTable(self, {
        name: "schema", 
        type: "UploadSchema",
        delete: deleteItem,
        refresh: load
    });

    function closeCopySchemasDialog() {
        root.closeDialog();
        load().then(utils.successHandler(self, null, "Schemas copied"));
    }
    self.copySchemasDialog = function(vm, event) {
        var copyables = self.itemsObs().filter(tables.hasBeenChecked);
        root.openDialog('copy_schemas', {
            copyables: copyables, 
            closeCopySchemasDialog: closeCopySchemasDialog
        });
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
        return sharedModuleUtils.loadNameMaps()
            .then(serverService.getAllUploadSchemas)
            .then(fn.handleSort('items', 'name'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};