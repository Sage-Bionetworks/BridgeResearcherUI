import 'knockout-postbox';
import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';
import toastr from 'toastr';

var OPTIONS = {offsetBy:null, pageSize: 1, assignmentFilter:false};

module.exports = function() {
    var self = this;
    
    var binder = new Binder(self)
        .obs('items[]', [])
        .obs('total', 0)
        .obs('result', '')
        .obs('searchLoading', false)
        .obs('idFilter')
        .obs('showResults', false);

    // For the forward pager control.
    self.vm = self;
    self.callback = fn.identity;

    fn.copyProps(self, root, 'codesEnumeratedObs', 'isDeveloper', 'isResearcher');
    tables.prepareTable(self, {name: 'external ID'});

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
        ko.postbox.publish('external-ids-page-refresh');
        return response;
    }
    function convertToPaged(identifier) {
        return function() {
            return {items: [{identifier: identifier}]};    
        };
    }
    function msgIfNoRecords(response) {
        if (response.items.length === 0) {
            self.recordsMessageObs("There are no external IDs (or none that start with your search string).");
        }
        return response;
    }
    self.openImportDialog = function(vm, event) {
        self.showResultsObs(false);
        root.openDialog('external_id_importer', {
            vm: self, 
            showCreateCredentials: true,
            reload: self.loadingFunc.bind(self)
        });
    };
    self.createFrom = function(data, event) {
        self.showResultsObs(false);
        utils.startHandler(self, event);
        createNewCredentials(data.identifier)
            .then(updatePageWithResult)
            .then(utils.successHandler(self, event))
            .catch(utils.failureHandler());
    };
    self.createFromNext = function(vm, event) {
        self.showResultsObs(false);
        utils.startHandler(vm, event);
        serverService.getExternalIds(OPTIONS)
            .then(extractId)
            .then(createNewCredentials)
            .then(updatePageWithResult)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler());
    };
    self.link = function(item) {
        return '#/participants/'+encodeURIComponent('externalId:'+item.identifier)+'/general';
    };
    self.doSearch = function(vm, event) {
        if (event.keyCode === 13) {
            self.callback();
        }
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
        params = params || {};
        params.idFilter = self.idFilterObs();
        return serverService.getExternalIds(params)
            .then(binder.update('total','items'))
            .then(msgIfNoRecords)
            .catch(utils.failureHandler());
    };
};