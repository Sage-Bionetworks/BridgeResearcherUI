import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';

let failureHandler = utils.failureHandler({
    redirectMsg:"Config element not found.", 
    redirectTo:"configs",
    transient: false
});

module.exports = function(params) {
    let self = this;

    fn.copyProps(self, root, 'isAdmin');

    new Binder(self)
        .obs('title', params.id)
        .obs('isNew', false)
        .obs('id', params.id)
        .obs('revision', params.revision);

    tables.prepareTable(self, {
        name:'configuration element revision',
        refresh: load,
        redirect: '#/configs',
        delete: function(item) {
            return serverService.deleteAppConfigElementRevision(item.id, item.revision, false);
        },
        deletePermanently: function(item) {
            return serverService.deleteAppConfigElementRevision(item.id, item.revision, true);
        },
        undelete: function(item) {
            return serverService.updateAppConfigElement(item);
        }
    });

    function getRevisions() {
        return serverService.getAppConfigElementRevisions(params.id, self.showDeletedObs());
    }

    function load() {
        serverService.getAppConfigElement(params.id, params.revision)
            .then(getRevisions)
            .then(fn.handleSort('items','label'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(failureHandler);
    }
    load();
};