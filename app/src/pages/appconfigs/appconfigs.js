import {serverService} from '../../services/server_service';
import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import root from '../../root';
import scheduleUtils from '../schedule/schedule_utils';
import tables from '../../tables';
import utils from '../../utils';

module.exports = function(params) {
    let self = this;

    fn.copyProps(self, root, 'isAdmin');

    tables.prepareTable(self, {
        name:'app config',
        delete: function(item) {
            return serverService.deleteAppConfig(item.guid, false);
        },
        deletePermanently: function(item) {
            return serverService.deleteAppConfig(item.guid, true);
        }
    });

    fn.copyProps(self, criteriaUtils, 'label->criteriaLabel');
    fn.copyProps(self, scheduleUtils, 'formatCompoundActivity');

    scheduleUtils.loadOptions()
        .then(serverService.getAppConfigs.bind(serverService))
        .then(fn.handleSort('items','label'))
        .then(fn.handleObsUpdate(self.itemsObs, 'items'))
        .catch(utils.failureHandler());
};