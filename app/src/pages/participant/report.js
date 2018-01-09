import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import jsonFormatter from '../../json_formatter';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function firstDayOfMonth(year, month) {
    return new Date(year, month, 1).toISOString().split("T")[0];
}
function lastDayOfMonth(year, month) {
    return new Date(year, month+1, 0).toISOString().split("T")[0];
}
var failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    var self = this;

    tables.prepareTable(self, {
        name: "report", 
        delete: deleteItem
    });

    new Binder(self)
        .obs('isNew', false)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('title', '&#160;')
        .obs('identifier', params.identifier)
        .obs('formatMonth')
        .obs('status')
        .obs('showLoader', false);

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(part.name);
        self.nameObs(part.name);
        self.statusObs(part.status);
    }).catch(failureHandler);
    
    self.isPublicObs = root.isPublicObs;
    self.isDeveloper = root.isDeveloper;
    self.linkMaker = function() {
        return '#/participants/'+self.userIdObs()+'/reports';
    };

    var d = new Date();
    self.currentMonth = d.getMonth();
    self.currentYear = d.getFullYear();    

    self.addReport = function(vm, event) {
        root.openDialog('report_editor', {
            closeDialog: self.closeDialog,
            identifier: params.identifier,
            userId: params.userId,
            type: "participant"
        });
    };
    self.closeDialog = function() {
        root.closeDialog();
        load();
    };
    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };
    self.editReportRecord = function(item) {
        root.openDialog('report_editor', {
            closeDialog: self.closeDialog,
            identifier: params.identifier,
            userId: params.userId,
            date: item.date,
            data: item.data,
            type: "participant"
        });
        return false;
    };    

    self.priorMonth = function() {
        if (self.currentMonth === 0) {
            self.currentYear--;
            self.currentMonth = 11;
        } else {
            self.currentMonth--;
        }
        load();
    };
    self.nextMonth = function() {
        if (self.currentMonth === 11) {
            self.currentYear++;
            self.currentMonth = 0;
        } else {
            self.currentMonth++;
        }
        load();
    };
    self.thisMonth = function() {
        var d = new Date();
        self.currentMonth = d.getMonth();
        self.currentYear = d.getFullYear();
        load();
    };

    function deleteItem(item) {
        return serverService.deleteParticipantReportRecord(params.userId, params.identifier, item.date);
    }
    function loadReport() {
        var startDate = firstDayOfMonth(self.currentYear, self.currentMonth);
        var endDate = lastDayOfMonth(self.currentYear, self.currentMonth);
        return serverService.getParticipantReport(params.userId, params.identifier, startDate, endDate);
    }

    function load() {
        self.showLoaderObs(true);
        self.formatMonthObs(MONTHS[self.currentMonth] + " " + self.currentYear);
        serverService.getParticipant(params.userId)
            .then(loadReport)
            .then(fn.handleMap('items', jsonFormatter.mapItem))
            .then(fn.handleSort('items', 'date', true))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .then(fn.handleStaticObsUpdate(self.showLoaderObs, false))
            .catch(failureHandler);
    }
    load();
};