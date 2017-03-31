var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
require('knockout-postbox');
var bind = require('../../binder');
var tables = require('../../tables');

// TODO: If we were really slick, we would validate the identifiers as valid passwords, because that's 
// how they'll be used when making lab credentials.

var OPTIONS = {offsetBy:0, pageSize: 1, assignmentFilter:false};

module.exports = function() {
    var self = this;
    
    var binder = bind(self)
        .obs('items[]', [])
        .obs('total', 0)
        .obs('result', '')
        .obs('showResults', false);

    self.codesEnumeratedObs = root.codesEnumeratedObs;
    self.isDeveloper = root.isDeveloper;
    tables.prepareTable(self, {name: 'external ID'});

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
    function updatePageWithResult(response) {
        self.showResultsObs(true);
        ko.postbox.publish('enrollees-page-refresh');
        return response;
    }
    function convertToPaged(identifier) {
        return function() {
            return {items: [{identifier: identifier}]};    
        };
    }
    function msgIfNoRecords(response) {
        if (response.items.length === 0) {
            self.recordsMessageObs("There are no participants (or none that start with your search string).");
        }
        return response;
    }
    self.openImportDialog = function(vm, event) {
        self.showResultsObs(false);
        root.openDialog('external_id_importer', {vm: self, showCreateCredentials: true});
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
    self.showLinkLoading = function(vm, event) {
        event.target.nextElementSibling.classList.add("active");
        return true;
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
    
    serverService.getStudy().then(binder.assign('study'));
    
    self.loadingFunc = function loadPage(params) {
        return serverService.getExternalIds(params)
            .then(binder.update('total','items'))
            .then(msgIfNoRecords)
            .catch(utils.failureHandler());
    };
};