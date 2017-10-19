import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import root from '../../root';
import scheduleUtils from '../schedule/schedule_utils';
import tables from '../../tables';
import utils from '../../utils';

module.exports = function(params) {
    var self = this;

    tables.prepareTable(self, {
        name:'app config',
        delete: function(item) {
            return serverService.deleteAppConfig(item.guid);
        }
    });

    fn.copyProps(self, criteriaUtils, 'label->criteriaLabel');
    fn.copyProps(self, scheduleUtils, 'formatCompoundActivity');
    fn.copyProps(self, root, 'isAdmin');

    // TODO: Exact same code is duplicated in SharedModuleUtils, this needs to be consolidated.
    scheduleUtils.loadOptions()
        .then(serverService.getAppConfigs.bind(serverService))
        .then(fn.handleSort('items','label'))
        .then(fn.handleObsUpdate(self.itemsObs, 'items'))
        .catch(utils.failureHandler());
};