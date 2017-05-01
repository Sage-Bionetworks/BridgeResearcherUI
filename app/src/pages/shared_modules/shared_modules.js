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
var PUBLISH_MSG = "Are you sure you want to publish this shared module version?"; // TODO
var NO_ITEMS_MSG = "There are currently no shared modules (or none with those search terms).";
var DELETE_CONFIRM_MSG = "This deletes ALL revisions of the module.\n\n"+
    "Use the module's history page to delete a single revision.\n\n"+
    "Are you sure you want to delete this shared module?";

module.exports = function() {
    var self = this;

    function doSearch(text, tagsOnly) {
        var query = "";
        if (text !== "") {
            if (tagsOnly) {
                query = "?mostrecent=false&tags=" + encodeURIComponent(text);
            } else {
                var str = "name like '%"+text+"%' or notes like '%"+text+"%'";
                query = "?mostrecent=false&where=" + encodeURIComponent(str);
            }
        }
        serverService.getMetadata(query)
            .then(updateTable)
            .catch(utils.failureHandler());
    }

    self.itemsObs = ko.observableArray([]);
    self.recordsMessageObs = ko.observable("<div class='ui tiny active inline loader'></div>");
    self.formatDescription = sharedModuleUtils.formatDescription;
    self.formatTags = sharedModuleUtils.formatTags;
    self.formatVersions = sharedModuleUtils.formatVersions;
    self.tagsOnlyObs = ko.observable(false).extend({ rateLimit: 300 });
    self.tagsOnlyObs.subscribe(function(newValue) {
        doSearch(self.searchObs(), newValue);
    });
    self.searchObs = ko.observable("").extend({ rateLimit: 300 });
    self.searchObs.subscribe(function(newValue) {
        doSearch(newValue, self.tagsOnlyObs());
    });
    self.clearSearch = function() {
        self.searchObs("");
        self.tagsOnlyObs(false);
    };

    self.deleteItem = function(item, event) {
        alerts.deleteConfirmation(DELETE_CONFIRM_MSG, function() {
            utils.startHandler(self, event);
            serverService.deleteMetadata(item.id)
                .then(load)
                .then(utils.successHandler(self, event, "Shared module deleted."))
                .catch(utils.failureHandler(self, event));
        });
    };
    self.publishItem = function(item, event) {
        alerts.confirmation(PUBLISH_MSG, function() {
            utils.startHandler(self, event);
            item.published = true;
            serverService.updateMetadata(item)
                .then(load)
                .then(utils.successHandler(self, event, "Shared module deleted."))
                .catch(utils.failureHandler());
        });
    };

    function updateTable(response) {
        if (response.items.length === 0) {
            self.recordsMessageObs(NO_ITEMS_MSG);
        }
        self.itemsObs(response.items);
    }

    function load() {
        sharedModuleUtils.loadNameMaps()
            .then(serverService.getMetadata)
            .then(updateTable)
            .catch(utils.failureHandler());
    }
    load();
};