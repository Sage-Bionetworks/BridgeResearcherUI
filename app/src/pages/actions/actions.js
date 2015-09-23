var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.messageObs = ko.observable("");

    self.emailRoster = function(vm, event) {
        utils.startHandler(self, event);

        serverService.emailRoster()
            .then(utils.successHandler(vm, event, "Roster has been emailed to your consent coordinator."))
            .catch(utils.failureHandler(vm, event));
    };
};