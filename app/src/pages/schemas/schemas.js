var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');
var root = require('../../root');
var Promise = require('bluebird');

module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);
    self.itemsObs = ko.observableArray([]);

    function closeCopySchemasDialog() {
        root.closeDialog();
        root.message('success', 'Schemas copied');
        load();
    }

    self.atLeastOneChecked = function () {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    };
    self.copySchemasDialog = function(vm, event) {
        var copyables = self.itemsObs().filter(utils.hasBeenChecked);
        root.openDialog('copy_schemas', {copyables: copyables, closeCopySchemasDialog: closeCopySchemasDialog});
    };
    self.deleteSchemas = function(vm, event) {
        var deletables = self.itemsObs().filter(utils.hasBeenChecked);
        var msg = (deletables.length > 1) ?
                "You will delete ALL revisions of these upload schemas.\n\nAre you sure you want to delete these schemas?" :
                "You will delete ALL revisions of this upload schema.\n\nAre you sure you want to delete this schema?";
        var confirmMsg = (deletables.length > 1) ?
                "All revisions of these schemas have been deleted." : "All revisions of this schema have been deleted.";

        if (confirm(msg)) {
            utils.startHandler(self, event);
            Promise.map(deletables, function(schema) {
                return serverService.deleteSchema(schema.schemaId);
            }).then(utils.makeTableRowHandler(vm, deletables, "#/schemas"))
                .then(utils.successHandler(vm, event, confirmMsg))
                .catch(utils.failureHandler(vm, event));
        }
    };

    function load() {
        serverService.getAllUploadSchemas().then(function(response) {
            var items = response.items
                .sort(utils.makeFieldSorter("name"))
                .map(utils.addCheckedObs);
            if (items.length) {
                self.itemsObs(items);
            } else {
                document.querySelector(".loading_status").textContent = "There are currently no upload schemas.";
            }
        });
    }
    load();
};