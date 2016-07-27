var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var root = require('../../root');
var tables = require('../../tables');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('userId', params.userId)
        .obs('name', params.name)
        .obs('isNew', false)
        .obs('title', params.name);

    var upLink = "#/participants/"+params.userId+"/reports/"+encodeURIComponent(params.name);

    tables.prepareTable(self, 'report', upLink, function(item) {
        return serverService.deleteParticipantReport(item.identifier, params.userId);
    });

    self.isDeveloper = root.isDeveloper;
    self.isResearcher = root.isResearcher;

    self.reportURL = function(item) {
        return '#/participants/' + self.userIdObs() + '/reports/' + item.identifier + '/' + encodeURIComponent(params.name);        
    };
    self.addReport = function(vm, event) {
        root.openDialog('add_report', {
            closeDialog: self.closeDialog,
            userId: params.userId,  
            type: "participant"
        });
    };
    self.closeDialog = function() {
        root.closeDialog();
        load();
    };

    function load() {
        serverService.getParticipantReports().then(function(response) {
            self.itemsObs(response.items.sort(utils.makeFieldSorter("identifier")));
        });
    }
    load();
};