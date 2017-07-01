import { Binder } from '../../binder';
import fn from '../../functions';
import root from '../../root';
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

var failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    var self = this;

    new Binder(self)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('isNew', false)
        .obs('status')
        .obs('title', '&#160;');

    fn.copyProps(self, root, 'isPublicObs', 'isDeveloper', 'isResearcher');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.nameObs(root.isPublicObs() ? part.name : part.externalId);
        self.statusObs(part.status);
    }).catch(failureHandler);

    tables.prepareTable(self, {
        name:'report', 
        delete: deleteItem
    });

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

    function deleteItem(item) {
        return serverService.deleteParticipantReport(item.identifier, params.userId);
    }
    function load() {
        serverService.getParticipant(params.userId)
            .then(serverService.getParticipantReports)
            .then(fn.handleSort('items', 'identifier'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(failureHandler);
    }
    load();
};