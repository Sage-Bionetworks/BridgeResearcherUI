var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.messageObs = ko.observable("");

    self.emailRoster = function(vm, event) {
        utils.startHandler(self, event);

        serverService.email()
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                self.messageObs({text: response.message});
            })
            .catch(utils.failureHandler(vm, event));
    };
};