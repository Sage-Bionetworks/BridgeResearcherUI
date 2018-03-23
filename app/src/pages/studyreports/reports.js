import {serverService} from '../../services/server_service';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';

function deleteItem(item) {
    return serverService.deleteStudyReport(item.identifier);
}

module.exports = function() {
    let self = this;

    self.isDeveloper = root.isDeveloper;

    tables.prepareTable(self, {
        name: "report", 
        delete: deleteItem
    });
    self.addReport = function(vm, event) {
        root.openDialog('report_editor', {
            closeDialog: self.closeDialog, 
            type: "study"
        });
    };
    self.closeDialog = function() {
        root.closeDialog();
        load();
    };
    function processStudyReport(item) {
        item.publicObs = ko.observable(item.public);
        item.toggleObs = ko.observable(item.public);
        item.toggleObs.subscribe(function(newValue) {
            item.public = newValue;
            serverService.updateStudyReportIndex(item).then(function() {
                item.toggleObs(newValue);
                item.publicObs(newValue);
            });
        });
    }
    function load() {
        serverService.getStudyReports()
            .then(fn.handleForEach('items', processStudyReport))
            .then(fn.handleSort('items', 'identifier'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};