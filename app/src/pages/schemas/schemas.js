import {serverService} from '../../services/server_service';
import * as schemaUtils from '../schema/schema_utils';
import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import root from '../../root';
import sharedModuleUtils from '../../shared_module_utils';
import tables from '../../tables';
import utils from '../../utils';

module.exports = function() {
    let self = this;

    schemaUtils.initSchemasVM(self);
    fn.copyProps(self, root, 'isAdmin', 'isDeveloper');
    fn.copyProps(self, sharedModuleUtils, 'formatModuleLink', 'moduleHTML');
    fn.copyProps(self, criteriaUtils, 'label');
    
    tables.prepareTable(self, {
        name: "schema", 
        type: "UploadSchema",
        refresh: load,
        delete: function(item) {
            return serverService.deleteSchema(item.schemaId, false);
        },
        deletePermanently: function(item) {
            return serverService.deleteSchema(item.schemaId, true);
        },
        undelete: function(item) {
            return serverService.updateUploadSchema(item);
        }
    });

    function closeCopySchemasDialog() {
        root.closeDialog();
        load().then(utils.successHandler(self, null, "Schemas copied"));
    }
    self.copySchemasDialog = function(vm, event) {
        let copyables = self.itemsObs().filter(tables.hasBeenChecked);
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

    function getAllUploadSchemas() {
        return serverService.getAllUploadSchemas(self.showDeletedObs());
    }

    function load() {
        return sharedModuleUtils.loadNameMaps()
            .then(getAllUploadSchemas)
            .then(fn.handleSort('items', 'name'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};