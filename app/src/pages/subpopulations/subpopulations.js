var serverService = require('../../services/server_service');
var utils = require('../../utils');
var criteriaUtils = require('../../criteria_utils');
var root = require('../../root');
var tables = require('../../tables');

module.exports = function() {
    var self = this;

    self.criteriaLabel = criteriaUtils.label;
    self.isDeveloper = root.isDeveloper;

    tables.prepareTable(self, "consent group", function(plan) {
        return serverService.deleteSubpopulation(plan.guid);
    });

    serverService.getAllSubpopulations().then(function(response) {
        self.itemsObs(response.items.sort(utils.makeFieldSorter("name")));
    });
};