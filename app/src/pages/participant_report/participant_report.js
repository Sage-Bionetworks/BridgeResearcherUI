var serverService = require('../../services/server_service');
var bind = require('../../binder');
var root = require('../../root');
var jsonFormatter = require('../../json_formatter');
var ko = require('knockout');
var tables = require('../../tables');

function startDate() {
    var d = new Date();
    d.setDate(d.getDate() - 21);
    return d.toISOString().split("T")[0];
}
function endDate() {
    return new Date().toISOString().split("T")[0];
}
function deleteItem(item) {
    return serverService.deleteParticipantReportRecord(params.userId, params.identifier, item.date);
}
module.exports = function(params) {
    var self = this;

    tables.prepareTable(self, 
        "report", 
        "#/participants/"+params.userId+"/reports/"+encodeURIComponent(params.name),
        deleteItem);

    bind(self)
        .obs('isNew', false)
        .obs('userId', params.userId)
        .obs('name', params.name)
        .obs('title', params.name)
        .obs('identifier', params.identifier);

    self.isDeveloper = root.isDeveloper;

    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };
    self.addReport = function(vm, event) {
        root.openDialog('add_report', {
            closeDialog: self.closeDialog,
            userId: params.userId, 
            identifier: params.identifier,
            type: "participant"
        });
    };
    self.closeDialog = function() {
        root.closeDialog();
        load();
    };

    function mapResponse(response) {
        response.items = response.items.map(jsonFormatter.mapItem);
        self.itemsObs(response.items.sort());
    }
    function load() {
        serverService.getParticipantReport(params.userId, params.identifier, startDate(), endDate())
            .then(mapResponse);
    }
    load();
};