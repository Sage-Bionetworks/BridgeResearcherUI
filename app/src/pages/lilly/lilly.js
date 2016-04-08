var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var toastr = require('toastr');

module.exports = function() {
    var self = this;
    
    self.resultObs = ko.observable("");
    self.identifierObs = ko.observable("");

    var emailTemplate = null;
    serverService.getStudy().then(function(study) {
        emailTemplate = createEmailTemplate(study.supportEmail);
    });
    
    self.createNextAccount = function(vm, event) {
        var nextId = self.identifierObs().trim();

        utils.startHandler(vm, event);
        serverService.addExternalIds([nextId])
            .then(createParticipant(nextId))
            .then(utils.successHandler(vm, event))
            .then(handleUserCreated(nextId))
            .catch(utils.failureHandler(vm, event));
    };
    
    function createParticipant(nextId) {
        return function(response) {
            var participant = {
                "email": emailTemplate(nextId),
                "password": nextId,
                "externalId": nextId,
                "sharingScope": "all_qualified_researchers"
            };
            return serverService.createParticipant(participant);
        }
    }
    function handleUserCreated(nextId) {
        return function(response) {
            self.identifierObs("");
            self.resultObs(nextId);
        }
    }
    function createEmailTemplate(email) {
        var parts = email.split("@");
        if (parts[0].indexOf("+") > -1) {
            parts[0] = parts[0].split("+")[0];
        }
        return function(id) {
            return parts[0] + "+" + id + "@" + parts[1];
        }
    }
}