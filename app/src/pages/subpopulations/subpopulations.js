import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import root from '../../root';
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

function deleteItem(plan) {
    return serverService.deleteSubpopulation(plan.guid);
}

module.exports = function() {
    var self = this;

    fn.copyProps(self, root, 'isDeveloper', 'isAdmin');
    self.criteriaLabel = criteriaUtils.label;

    tables.prepareTable(self, {
        name: "consent group",
        type: "Subpopulation",
        delete: deleteItem,
        refresh: load
    });

    function load() {
        serverService.getAllSubpopulations()
            .then(fn.handleSort('items','name'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};