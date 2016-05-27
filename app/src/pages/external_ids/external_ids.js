var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
require('knockout-postbox');
var bind = require('../../binder');

// TODO: If we were really slick, we would validate the identifiers as valid passwords, because that's 
// how they'll be used when making lab credentials.

var OPTIONS = {offsetBy:0, pageSize: 1, assignmentFilter:false};

module.exports = function() {
    var self = this;
    
    var binder = bind(self)
        .obs('items[]', [])
        .obs('total', 0)
        .obs('externalIdValidationEnabled', false)
        .obs('result', '')
        .obs('showResults', false);

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
        var participant = utils.createParticipantForID(self.study.supportEmail, identifier);
        return serverService.createParticipant(participant);
    }
    function updatePageWithResult() {
        self.showResultsObs(true);
        ko.postbox.publish('external-ids-page-refresh');
    }
    function showManagementEnabled() {
        self.externalIdValidationEnabledObs(true);
    } 
    function convertToPaged(identifier) {
        return function() {
            return {items: [{identifier: identifier}]};    
        }
    }
    function msgIfNoRecords(response) {
        if (response.items.length === 0) {
            document.querySelector(".loading_status").textContent = "There are no external IDs (or none that match your search).";
        }
        return response;
    }
    
    self.openImportDialog = function(vm, event) {
        self.showResultsObs(false);
        root.openDialog('external_id_importer', {vm: self});
    };
    self.enableManagement = function(vm, event) {
        if (self.study != null) {
            utils.startHandler(self, event);
            self.study.externalIdValidationEnabled = true;
            
            serverService.saveStudy(self.study)
                .then(showManagementEnabled)
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
        serverService.addExternalIds([identifier])
            .then(convertToPaged(identifier))
            .then(extractId)
            .then(createNewCredentials)
            .then(updatePageWithResult)
            .then(utils.successHandler())
            .catch(utils.failureHandler());
    };
    
    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update('externalIdValidationEnabled'));
    
    self.loadingFunc = function loadPage(params) {
        return serverService.getExternalIds(params)
            .then(binder.update('total','items'))
            .then(msgIfNoRecords)
            .catch(utils.failureHandler());
    }
}