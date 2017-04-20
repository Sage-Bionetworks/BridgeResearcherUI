var sharedModuleUtils = require('../../shared_module_utils');
var serverService = require('../../services/server_service');
var tables = require('../../tables');
var utils = require('../../utils');
var ko = require('knockout');
var alerts = require('../../widgets/alerts');
var fn = require('../../transforms');

function deleteItem(item) {
    return serverService.deleteMetadataVersion(item.id, item.version);
}
var surveyNameMap = {};
var schemaNameMap = {};
var DELETE_CONFIRM_MSG = "This deletes ALL revisions of the module.\n\n"+
    "Use the module's history page to delete a single revision.\n\n"+
    "Are you sure you want to delete this shared module?";

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);
    self.recordsMessageObs = ko.observable("<div class='ui tiny active inline loader'></div>");
    self.formatDescription = sharedModuleUtils.formatDescription(surveyNameMap, schemaNameMap);
    self.formatTags = sharedModuleUtils.formatTags;
    self.formatVersions = sharedModuleUtils.formatVersions;

    self.deleteItem = function(item, event) {
        alerts.deleteConfirmation(DELETE_CONFIRM_MSG, function() {
            utils.startHandler(self, event);
            serverService.deleteMetadata(item.id)
                .then(load)
                .then(utils.successHandler(self, event, "Shared module deleted."))
                .catch(utils.failureHandler(self, event));
        });
    };

    function load() {
        sharedModuleUtils.loadNameMaps(surveyNameMap, schemaNameMap)
            .then(serverService.getMetadata)
            .then(function(response) {
                if (response.items.length === 0) {
                    self.recordsMessageObs("There are currently no shared modules.");
                }
                self.itemsObs(response.items);
            }).catch(utils.failureHandler());
    }
    load();
};