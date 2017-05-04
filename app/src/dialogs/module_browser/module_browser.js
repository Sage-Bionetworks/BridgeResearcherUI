var root = require('../../root');
var tables = require('../../tables');
var serverService = require('../../services/server_service');
var sharedModuleUtils = require('../../shared_module_utils');
var utils = require('../../utils');
var ko = require('knockout');

/*
- Hide things that are already imported?
- See if your import is up-to-date or not in survey list or browser
- import an updated version
*/
module.exports = function(params) {
    var self = this;
    var importedMods = {};
    var methName = (params.type === "survey") ? "getSurveys" : "getAllUploadSchemas";
    var scrollTo = utils.makeScrollTo(".item");

    self.title = "Shared " + params.type + "s";
    self.formatDescription = sharedModuleUtils.formatDescription;
    self.formatTags = sharedModuleUtils.formatTags;
    self.formatVersions = sharedModuleUtils.formatVersions;
    self.searchObs = ko.observable("").extend({ rateLimit: 300 });
    self.searchObs.subscribe(load);

    tables.prepareTable(self, {name: params.type});

    self.importItem = function(item, event) {
        utils.startHandler(self, event);
        serverService.importMetadata(item.id, item.version)
            .then(params.closeModuleBrowser)
            .then(utils.successHandler(self, event))
            .catch(utils.dialogFailureHandler(self, event, scrollTo));
    };
    self.isImported = function(metadata) {
        return importedMods[metadata.id+"/"+metadata.version];
    };
    self.cancel = params.closeModuleBrowser;

    function searchForModules() {
        var query = "?published=true";
        var text = self.searchObs();
        if (text === "") {
            query += "&mostrecent=true";
        } else {
            var str = "name like '%"+text+"%' or notes like '%"+text+"%'";
            query += "&mostrecent=false&where=" + encodeURIComponent(str);
        }
        return serverService.getMetadata(query, params.type);
    }
    function loadItems(response) {
        self.itemsObs(response.items.reverse());
    }
    function addImportedModules(response) {
        response.items.filter(function(item) {
            return item.moduleId;
        }).forEach(function(item) {
            importedMods[item.moduleId+"/"+item.moduleVersion] = true;
        });
    }

    function load() {
        serverService[methName]()
            .then(addImportedModules)
            .then(sharedModuleUtils.loadNameMaps)
            .then(searchForModules)
            .then(loadItems);
    }
    load();
};