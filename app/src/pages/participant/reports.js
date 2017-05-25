var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var root = require('../../root');
var tables = require('../../tables');
var fn = require('../../functions');

function deleteItem(item) {
    return serverService.deleteParticipantReport(item.identifier, params.userId);
}

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('isNew', false)
        .obs('title', '&#160;');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.nameObs(root.isPublicObs() ? part.name : part.externalId);
    }).catch(utils.failureHandler());

    tables.prepareTable(self, {
        name:'report', 
        delete: deleteItem
    });
    self.isPublicObs = root.isPublicObs;
    self.isDeveloper = root.isDeveloper;
    self.isResearcher = root.isResearcher;

    self.reportURL = function(item) {
        return root.userPath() + self.userIdObs() + '/reports/' + item.identifier;        
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
        self.itemsObs(response.items.sort(fn.makeFieldSorter("identifier")));
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