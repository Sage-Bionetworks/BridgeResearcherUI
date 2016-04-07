var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');

module.exports = function() {
    var self = this;
    
    self.itemsObs = ko.observableArray([]);
    self.recordsObs = ko.observable(0);
    self.showRecordsObs = ko.observable(false);
    
    self.importer = function(vm, event) {
        root.openDialog('external_id_importer', {vm: self});
    };
    self.closeImportDialog = function() {
        root.closeDialog();
        self.loadingFunc().then(utils.successHandler(self, {}, "Identifiers imported."));
    };
    self.manage = function(vm, event) {
        if (self.study != null) {
            utils.startHandler(self, event);
            self.study.externalIdValidationEnabled = true;
            
            serverService.saveStudy(self.study)
                .then(utils.successHandler(vm, event, "External ID management enabled."))
                .then(function() {
                    self.showRecordsObs(true);
                })
                .catch(utils.failureHandler(vm, event));
        }
    };
    
    serverService.getStudy().then(function(study) {
        self.study = study;
        self.showRecordsObs(study.externalIdValidationEnabled);
    });
    
    self.loadingFunc = function loadPage(params) {
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