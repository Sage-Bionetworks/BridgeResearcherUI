import Binder from '../../binder';
import * as fn from '../../functions';
import root from '../../root';
import serverService from '../../services/server_service';
import tables from '../../tables';

module.exports = function() {
    var self = this;
    var assignmentFilter;

    var binder = new Binder(self)
        .obs('items[]', [])
        .obs('result', '')
        .obs('idFilter')
        .obs('pageKey')
        .obs('searchLoading')
        .obs('showResults', false);

    self.vm = self;
    self.callback = fn.identity;

    self.codesEnumeratedObs = root.codesEnumeratedObs;
    tables.prepareTable(self, {name: 'external ID'});

    function msgIfNoRecords(response) {
        if (response.items.length === 0) {
            self.recordsMessageObs("There are no participants (or none that start with your search string).");
        }
        return response;
    }
    function getValue(value) {
        switch(value) {
            case 'true': return 'true';
            case 'false': return 'false';
            default: return null;
        }
    }    
    self.openImportDialog = function(vm, event) {
        self.showResultsObs(false);
        root.openDialog('external_id_importer', {
            vm: self, 
            showCreateCredentials: false, 
            reload: self.loadingFunc, 
            autoCredentials: true
        });
    };
    self.doSearch = function(vm, event) {
        if (event.keyCode === 13) {
            self.callback();
        }
    };
    self.assignFilter = function(vm, event) {
        assignmentFilter = getValue(event.target.value);
        self.callback();
        return true;
    };
        
    serverService.getStudy().then(binder.assign('study'));
    
    self.loadingFunc = function loadPage(args) {
        args = args || {};
        args.assignmentFilter = assignmentFilter; 
        args.idFilter = self.idFilterObs();

        self.searchLoadingObs(true);
        return serverService.getExternalIds(args)
            .then(binder.update('items'))
            .then(fn.handleStaticObsUpdate(self.searchLoadingObs, false))
            .then(msgIfNoRecords);
    };
};