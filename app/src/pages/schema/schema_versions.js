'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var Promise = require('es6-promise').Promise;

module.exports = function(params) {
    var self = this;

    self.nameObs = ko.observable();
    self.schemaIdObs = ko.observable(params.schemaId);
    self.itemsObs = ko.observableArray([]);

    self.link = function(item) {
        return "#/schemas/"+encodeURIComponent(item.schemaId)+"/versions/"+item.revision;
    };
    self.anyChecked = function() {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    };
    self.deleteRevisions = function(vm, event) {
        var deletables = self.itemsObs().filter(utils.hasBeenChecked);
        var msg = (deletables.length > 2) ?
                "Are you sure you want to delete these schema versions?" :
                "Are you sure you want to delete this schema version?";
        var confirmMsg = (deletables.length > 2) ?
                "Upload schemas deleted." : "Upload schema deleted.";
        if (confirm(msg)) {
            utils.startHandler(self, event);

            var promises = deletables.map(function(revision) {
                return serverService.deleteSchemaRevision(revision);
            });
            Promise.all(promises)
                .then(utils.makeTableRowHandler(vm, deletables, "#/schemas"))
                .then(utils.successHandler(vm, event, confirmMsg))
                .catch(utils.failureHandler(vm, event));
        }
    };
    serverService.getUploadSchemaAllRevisions(params.schemaId).then(function(response) {
        self.itemsObs(response.items.map(utils.addCheckedObs));
        if (response.items.length) {
            self.nameObs(response.items[0].name);
        }
    });
};