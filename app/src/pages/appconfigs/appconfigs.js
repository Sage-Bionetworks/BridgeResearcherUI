import {serverService} from '../../services/server_service';
import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import scheduleUtils from '../schedule/schedule_utils';
import tables from '../../tables';
import utils from '../../utils';

module.exports = function() {
    let self = this;

    tables.prepareTable(self, {
        name:'app config',
        refresh: load,
        delete: function(item) {
            return serverService.deleteAppConfig(item.guid, false);
        },
        deletePermanently: function(item) {
            return serverService.deleteAppConfig(item.guid, true);
        },
        undelete: function(item) {
            return serverService.updateAppConfig(item);
        }
    });

    fn.copyProps(self, criteriaUtils, 'label->criteriaLabel');
    fn.copyProps(self, scheduleUtils, 'formatCompoundActivity');
    fn.copyProps(self, fn, 'formatDateTime');

    function getAppConfigs() {
        return serverService.getAppConfigs(self.showDeletedObs());
    }

    function load() {
        scheduleUtils.loadOptions()
            .then(getAppConfigs)
            .then(fn.handleSort('items','label'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};