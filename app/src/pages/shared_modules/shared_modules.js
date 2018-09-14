import {serverService} from '../../services/server_service';
import alerts from '../../widgets/alerts';
import config from '../../config';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import sharedModuleUtils from '../../shared_module_utils';
import tables from '../../tables';
import utils from '../../utils';

const OPTIONS = [
    {label: "Surveys only", value: "survey"},
    {label: "Upload schemas only", value: "schema"},
    {label: "Both", value: "both"}
];
module.exports = function() {
    let self = this;
    self.isAdmin = root.isAdmin;

    function doSearch() {
        let text = self.searchObs();
        let tagsOnly = self.tagsOnlyObs();
        console.log("tagsOnly", tagsOnly);
        let modType = self.moduleTypeFilterObs();

        let query = {mostrecent:false};
        if (text === "") {
            query.mostrecent = true;
        } else if (tagsOnly) {
            query.tags = text;
        } else {
            query.name = text;
            query.notes = text;
        }
        serverService.getMetadata(query, modType)
            .catch(utils.failureHandler());
    }

    tables.prepareTable(self, {
        name: "shared module",
        type: "SharedModuleMetadata", 
        refresh: load, 
        delete: function(item) {
            serverService.deleteMetadata(item.id, false);
        },
        deletePermanently: function(item) {
            serverService.deleteMetadata(item.id, true);
        },
        undelete: function(metadata) {
            return serverService.updateMetadata(metadata);
        }
    });

    self.moduleTypeOptions = OPTIONS;
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
    function loadMetadata() {
        return serverService.getMetadata({includeDeleted: self.showDeletedObs()})
            .then(fn.handleObsUpdate(self.itemsObs, 'items'));
    }

    function load() {
        sharedModuleUtils.loadNameMaps()
            .then(loadMetadata)
            .catch(utils.failureHandler());
    }
    load();
};