import {serverService} from '../../services/server_service';
import fn from '../../functions';
import tables from '../../tables';
import utils from '../../utils';

module.exports = function() {
    let self = this;

    self.formatDateTime = fn.formatDateTime;

    tables.prepareTable(self, {
        name:'configuration element',
        refresh: load,
        delete: function(item) {
            return serverService.deleteAppConfigElement(item.id, false);
        },
        deletePermanently: function(item) {
            return serverService.deleteAppConfigElement(item.id, true);
        },
        undelete: function(item) {
            return serverService.updateAppConfigElement(item);
        }
    });

    function load() {
        serverService.getAppConfigElements(self.showDeletedObs())
            .then(fn.handleSort('items','label'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};