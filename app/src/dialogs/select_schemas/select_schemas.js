var serverService = require('../../services/server_service');
var root = require('../../root');
var utils = require('../../utils');
var tables = require('../../tables');
var ko = require('knockout');

module.exports = function(params) {
    var self = this;

    self.cancel = root.closeDialog;

    self.select = function() {
        var schemas = self.itemsObs().filter(function(object) {
            return object.checkedObs();
        });
        params.addSchemas(schemas);
    };
    self.toggleChecked = function(item) {
        item.checkedObs(!item.checkedObs());
    };

    tables.prepareTable(self, {
        name: "schema",
        type: "UploadSchema",
        refresh: load
    });

    function isSelected(schema) {
        return !!match(schema);
    }
    function notSelected(schema) {
        return !isSelected(schema);
    }
    function match(schema) {
        return params.selected.filter(function(selectedSchema) {
            return (selectedSchema.id === schema.schemaId);
        })[0];
    }
    function schemaToView(schema) {
        var obj = {id: schema.schemaId};
        var selectedSchema = match(schema);
        if (selectedSchema) {
            obj.revision = selectedSchema.revision;
        }
        obj.checkedObs = ko.observable(!!selectedSchema);
        return obj;
    }

    function load() { 
        serverService.getAllUploadSchemas().then(function(response) {
            var selected = response.items.filter(isSelected).map(schemaToView);
            var rest = response.items.filter(notSelected).map(schemaToView);
            self.itemsObs.pushAll(selected);
            self.itemsObs.pushAll(rest);
        }).catch(utils.failureHandler());
    }
    load();
};
