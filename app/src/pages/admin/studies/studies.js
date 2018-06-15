import {serverService} from '../../../services/server_service';
import fn from '../../../functions';
import tables from '../../../tables';

function deleteStudy(item) {
    if (item.identifier !== 'api' && item.identifier !== 'shared') {
        return serverService.deleteStudy(item.identifier);
    } else {
        return Promise.resolve();
    }
}

module.exports = function() { 
    let self = this;

    tables.prepareTable(self, {
        name: 'study',
        plural: 'studies',
        delete: deleteStudy
    });

    serverService.getSession().then(function(session) {
        return serverService.getStudyList(session.environment);
    }).then(fn.handleObsUpdate(self.itemsObs, 'items'));
};