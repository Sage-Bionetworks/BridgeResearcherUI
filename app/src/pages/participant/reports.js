var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var root = require('../../root');
var tables = require('../../tables');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('isNew', false)
        .obs('title', '&#160;');

    serverService.getParticipantName(params.userId).then(function(name) {
        self.nameObs(name);
        self.titleObs(name);
    });

    tables.prepareTable(self, 'report', function(item) {
        return serverService.deleteParticipantReport(item.identifier, params.userId);
    });

    self.isDeveloper = root.isDeveloper;
    self.isResearcher = root.isResearcher;

    self.reportURL = function(item) {
        return '#/participants/' + self.userIdObs() + '/reports/' + item.identifier;        
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

    function loadItems(response) {
        self.itemsObs(response.items.sort(utils.makeFieldSorter("identifier")));
    }
    function loadParticipantReports() {
        return serverService.getParticipantReports();
    }

    function load() {
        serverService.getParticipant(params.userId)
            .then(loadParticipantReports)
            .then(loadItems)
            .catch(utils.notFoundHandler("Participant", "participants"));
    }
    load();
};