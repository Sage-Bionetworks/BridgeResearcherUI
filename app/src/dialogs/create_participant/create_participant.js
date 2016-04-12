var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

var fields = ['email','password','externalId','showResults','externalIdValidated','identifier'];

module.exports = function() {
    var self = this;
    var participant = {};
    var email = null;
    
    utils.observablesFor(self, fields);
    self.showResultsObs(false);

    self.close = function() {
        root.closeDialog();
    }
    
    self.create = function(vm, event) {
        var nextId = self.identifierObs();
        
        utils.startHandler(vm, event);
        createParticipant({items:[{identifier: nextId}]})
            .then(function(response) {
                utils.valuesToObservables(vm, participant, fields);
                self.showResultsObs(true);
            })
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler(vm, event));
    }
    
    self.assign = function(vm, event) {
        utils.startHandler(vm, event);
        serverService.getExternalIds({offsetBy:0, pageSize: 1, assignmentFilter:false})
            .then(createParticipant)
            .then(function(response) {
                utils.valuesToObservables(vm, participant, fields);
                self.showResultsObs(true);
            })
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler(vm, event));
    };
    
    serverService.getStudy().then(function(study) {
        email = study.supportEmail;
        self.externalIdValidatedObs(study.externalIdValidationEnabled);
    });
    
    function createParticipant(response) {
        if (response.items.length === 0) {
            throw new Error("There are no unassigned external IDs registered with your study. Please see the external identifers screen for more information.");
        }
        var nextId = response.items[0];
        participant = {
            email: createEmailTemplate(nextId.identifier),
            password: nextId.identifier,
            externalId: nextId.identifier,
            sharingScope: "sponsors_and_partners"
        };
        return serverService.createParticipant(participant);
    }
    function createEmailTemplate(identifier) {
        var parts = email.split("@");
        if (parts[0].indexOf("+") > -1) {
            parts[0] = parts[0].split("+")[0];
        }
        return parts[0] + "+" + identifier + "@" + parts[1];
    }
    
}