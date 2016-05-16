var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
require('knockout-postbox');

var OPTIONS = {offsetBy:0, pageSize: 1, assignmentFilter:false};

module.exports = function() {
    var self = this;
    
    self.itemsObs = ko.observableArray([]);
    self.totalObs = ko.observable(0);
    self.managementEnabledObs = ko.observable(false);
    
    self.resultObs = ko.observable('');
    self.showResultsObs = ko.observable(false);
    
    // to get a spinner on this control you need to adjust the DOM target.
    // Creating a fake event for this.
    function adjustDropDownButtonTarget(event) {
        return {
            target: event.target.parentNode.parentNode
        };
    }    
    function extractId(response) {
        if (response.items.length === 0) {
            throw new Error("There are no unassigned external IDs registered with your study. Please import more IDs to create more credentials.");
        }
        return response.items[0].identifier;
    }
    function createNewCredentials(identifier) {
        self.resultObs(identifier);
        var participant = {
            "email": createEmailTemplate(identifier),
            "password": identifier,
            "externalId": identifier,
            "sharingScope": "all_qualified_researchers"
        };
        return serverService.createParticipant(participant);
    }
    function updatePageWithResult() {
        self.showResultsObs(true);
        ko.postbox.publish('external-ids-page-refresh');
    }
    function createEmailTemplate(identifier) {
        var parts = self.study.supportEmail.split("@");
        if (parts[0].indexOf("+") > -1) {
            parts[0] = parts[0].split("+")[0];
        }
        return parts[0] + "+" + identifier + "@" + parts[1];
    }
    function showManagementEnabled() {
        self.managementEnabledObs(true);
    } 
    function updateVersion(response) {
        self.study.version = response.version;
        return response;
    }
    
    self.openImportDialog = function(vm, event) {
        self.showResultsObs(false);
        root.openDialog('external_id_importer', {vm: self});
    };
    self.closeImportDialog = function() {
        root.closeDialog();
        ko.postbox.publish('external-ids-page-refresh');
        utils.successHandler(self, {}, "Identifiers imported.")();
    };
    self.enableManagement = function(vm, event) {
        if (self.study != null) {
            utils.startHandler(self, event);
            self.study.externalIdValidationEnabled = true;
            
            serverService.saveStudy(self.study)
                .then(showManagementEnabled)
                .then(updateVersion)
                .then(utils.successHandler(vm, event, "External ID management enabled."))
                .catch(utils.failureHandler(vm, event));
        }
    };
    self.createFrom = function(data, event) {
        self.showResultsObs(false);
        utils.startHandler(self, event);
        createNewCredentials(data.identifier)
            .then(updatePageWithResult)
            .then(utils.successHandler(self, event))
            .catch(utils.failureHandler(self, event));
    };
    // createFromNew
    self.openNewIdDialog = function(vm, event) {
        self.showResultsObs(false);
        root.openDialog('new_external_id', {vm: self});
    };
    self.createFromNext = function(vm, event) {
        event = adjustDropDownButtonTarget(event);
        
        self.showResultsObs(false);
        utils.startHandler(vm, event);
        serverService.getExternalIds(OPTIONS)
            .then(extractId)
            .then(createNewCredentials)
            .then(updatePageWithResult)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler(vm, event));
    };
    // This is called from the dialog that allows a user to enter a new external identifier.
    self.createFromNew = function(identifier) {
        function asPaged() {
            return {items: [{identifier: identifier}]};
        }
        serverService.addExternalIds([identifier])
            .then(asPaged)
            .then(extractId)
            .then(createNewCredentials)
            .then(updatePageWithResult)
            .then(utils.successHandler())
            .catch(utils.failureHandler());
    };
    
    serverService.getStudy().then(function(study) {
        self.study = study;
        self.managementEnabledObs(study.externalIdValidationEnabled);
    });
    
    self.loadingFunc = function loadPage(params) {
        return serverService.getExternalIds(params).then(function(response) {
            self.totalObs(response.total);
            self.itemsObs(response.items);
            if (response.items.length === 0) {
                document.querySelector(".loading_status").textContent = "There are no external IDs (or none that match your search).";
            }
            return response;
        }).catch(utils.failureHandler());
    }
}