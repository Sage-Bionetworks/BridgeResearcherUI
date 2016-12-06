var serverService = require('../../services/server_service');
var utils = require('../../utils');
var criteriaUtils = require('../../criteria_utils');
var root = require('../../root');
var tables = require('../../tables');

function deleteItem(plan) {
    return serverService.deleteSubpopulation(plan.guid);
}

module.exports = function() {
    var self = this;

    self.criteriaLabel = criteriaUtils.label;
    self.isDeveloper = root.isDeveloper;
    self.isAdmin = root.isAdmin;

    tables.prepareTable(self, {
        name: "consent group",
        type: "Subpopulation",
        delete: deleteItem,
        refresh: load
    });

    function load() {
        serverService.getAllSubpopulations().then(function(response) {
            self.itemsObs(response.items.sort(utils.makeFieldSorter("name")));
        });
    }
    load();
};