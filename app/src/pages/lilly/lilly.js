var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;
    
    self.resultObs = ko.observable("");
    
    self.createNextAccount = function(vm, event) {
        utils.startHandler(vm, event);
        serverService.getExternalIds({pageSize: 1, assignmentFilter: false})
            .then(handleUnassignedIdResponse(vm, event))
            .catch(utils.failureHandler(vm, event));
    };
    
    function handleUnassignedIdResponse(vm, event) {
        return function(response) {
            if (response.items.length === 0) {
                throw new Error("No external IDs have been registered, or all registered IDs have been assigned.");
            }
            var nextId = response.items[0].identifier;
            var email = 'lilly+'+nextId+'@lilly.com';
            var participant = {
                "email": email,
                "password": nextId,
                "externalId": nextId,
                "sharingScope": "all_qualified_researchers"
            };
            serverService.createParticipant(participant)
                .then(utils.successHandler(vm, event))
                .then(handleUserCreated(nextId))
                .catch(utils.failureHandler(vm, event));
        }
    }

    function handleUserCreated(nextId) {
        return function(response) {
            self.resultObs("User ID #" + nextId + " created. Enter this ID into the app to register the device.");
        }
    }
}