var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
require('knockout-postbox');
var bind = require('../../binder');
var tables = require('../../tables');

var OPTIONS = {offsetBy:0, pageSize: 1, assignmentFilter:false};

module.exports = function() {
    var self = this;
    
    var binder = bind(self)
        .obs('items[]', [])
        .obs('total', 0)
        .obs('result', '')
        .obs('showResults', false);

    self.codesEnumeratedObs = root.codesEnumeratedObs;
    tables.prepareTable(self, {name: 'external ID'});

    function msgIfNoRecords(response) {
        if (response.items.length === 0) {
            self.recordsMessageObs("There are no participants (or none that start with your search string).");
        }
        return response;
    }
    self.openImportDialog = function(vm, event) {
        self.showResultsObs(false);
        root.openDialog('external_id_importer', {vm: self, showCreateCredentials: false});
    };
    
    serverService.getStudy().then(binder.assign('study'));
    
    self.loadingFunc = function loadPage(params) {
        return serverService.getExternalIds(params)
            .then(binder.update('total','items'))
            .then(msgIfNoRecords)
            .catch(utils.failureHandler());
    };
};