var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');

module.exports = function() {
    var self = this;
    
    self.itemsObs = ko.observableArray([]);
    self.recordsObs = ko.observable(0);
    
    self.importer = function(vm, event) {
        root.openDialog('external_id_importer', {vm: self});
    };
    self.closeImportDialog = function() {
        root.closeDialog();
        self.loadingFunc().then(utils.successHandler(self, {}, "Identifiers imported."));
    };
    
    self.loadingFunc = function loadPage(params) {
        console.log(JSON.stringify(params));
        return serverService.getExternalIds(params).then(function(response) {
            self.recordsObs(response.total);
            self.itemsObs(response.items);
            if (response.items.length === 0) {
                document.querySelector(".loading_status").textContent = "There are no external IDs (or none that match your search).";
            }
            return response;
        }).catch(utils.failureHandler());
    }
}