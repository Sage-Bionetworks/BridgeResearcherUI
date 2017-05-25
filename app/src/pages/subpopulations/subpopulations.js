var serverService = require('../../services/server_service');
var utils = require('../../utils');
var criteriaUtils = require('../../criteria_utils');
var root = require('../../root');
var tables = require('../../tables');
var fn = require('../../functions');

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
            .then(fn.handleSortItems('name'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};