var ko = require('knockout');
var serverService = require('../../services/server_service.js');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.messageObs = ko.observableArray("");
    self.itemsObs = ko.observableArray([]);
    self.formatDateTime = utils.formatDateTime;
    // TODO: This information is also on the detail editor screen.
    self.formatScheduleType = function(type) {
        if (type === "SimpleScheduleStrategy") {
            return "Simple Schedule Plan";
        } else if (type === "ABTestScheduleStrategy") {
            return "A/B Test Schedule Plan";
        }
    };

    serverService.getSchedulePlans().then(function(response) {
        if (response.items.length) {
            self.itemsObs(response.items);
        } else {
            document.querySelector(".loading.status").textContent = "There are currently no schedules.";
        }
    });
};