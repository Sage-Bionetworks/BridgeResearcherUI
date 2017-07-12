import alerts from '../../widgets/alerts';
import config from '../../config';
import ko from 'knockout';
import serverService from '../../services/server_service';
import sharedModuleUtils from '../../shared_module_utils';
import utils from '../../utils';

const NO_ITEMS_MSG = "There are currently no shared modules (or none with those search terms).";
const DELETE_CONFIRM_MSG = "This deletes ALL revisions of the module.\n\n"+
    "Use the module's history page to delete a single revision.\n\n"+
    "Are you sure you want to delete this shared module?";
const OPTIONS = [
    {label: "Surveys only", value: "survey"},
    {label: "Upload schemas only", value: "schema"},
    {label: "Both", value: "both"}
];
module.exports = function() {
    var self = this;

    function doSearch() {
        var text = self.searchObs();
        var tagsOnly = self.tagsOnlyObs();
        var modType = self.moduleTypeFilterObs();

        var query = "?mostrecent=false";
        if (text === "") {
            query = "?mostrecent=true";
        } else if (tagsOnly) {
            query += "&tags=" + encodeURIComponent(text);
        } else {
            var str = "name like '%"+text+"%' or notes like '%"+text+"%'";
            query += "&where=" + encodeURIComponent(str);
        }
        serverService.getMetadata(query, modType)
            .then(updateTable)
            .catch(utils.failureHandler());
    }

    self.moduleTypeOptions = OPTIONS;
    self.itemsObs = ko.observableArray([]);
    self.recordsMessageObs = ko.observable("<div class='ui tiny active inline loader'></div>");
    self.formatDescription = sharedModuleUtils.formatDescription;
    self.formatTags = sharedModuleUtils.formatTags;
    self.formatVersions = sharedModuleUtils.formatVersions;
    self.tagsOnlyObs = ko.observable(false).extend({ rateLimit: 300 });
    self.tagsOnlyObs.subscribe(doSearch);
    self.searchObs = ko.observable("").extend({ rateLimit: 300 });
    self.searchObs.subscribe(doSearch);
    self.moduleTypeFilterObs = ko.observable('both');
    self.moduleTypeFilterObs.subscribe(doSearch);

    self.clearSearch = function() {
        self.searchObs("");
        self.tagsOnlyObs(false);
        self.moduleTypeFilterObs("both");
    };

    self.deleteItem = function(item, event) {
        alerts.deleteConfirmation(DELETE_CONFIRM_MSG, function() {
            utils.startHandler(self, event);
            serverService.deleteMetadata(item.id)
                .then(load)
                .then(utils.successHandler(self, event, "Shared module deleted."))
                .catch(utils.failureHandler());
        });
    };
    self.publishItem = function(item, event) {
        alerts.confirmation(config.msgs.shared_modules.PUBLISH, function() {
            utils.startHandler(self, event);
            item.published = true;
            serverService.updateMetadata(item)
                .then(load)
                .then(utils.successHandler(self, event, "Shared module deleted."))
                .catch(utils.failureHandler());
        });
    };

    function updateTable(response) {
        var items = response.items;
        if (items.length === 0) {
            self.recordsMessageObs(NO_ITEMS_MSG);
        }
        self.itemsObs(items.reverse());
    }

    function load() {
        sharedModuleUtils.loadNameMaps()
            .then(serverService.getMetadata)
            .then(updateTable)
            .catch(utils.failureHandler());
    }
    load();
};