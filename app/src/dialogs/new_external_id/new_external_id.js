var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

module.exports = function(params) {
    var self = this;
    
    self.identifierObs = ko.observable();

    self.close = function() {
        root.closeDialog();
    };
    self.create = function(vm, event) {
        var nextId = self.identifierObs();

        utils.startHandler(vm, event);
        if (!utils.isNotBlank(nextId)) {
            return utils.formFailure(event.target, 'You must enter an ID.');
        } else if (!/^[a-zA-Z0-9-_]+$/.test(nextId)) {
            return utils.formFailure(event.target, 'ID must contain only digits, letters, underscores and dashes.');
        }
        serverService.getParticipants(0, 5, "+"+nextId+"@").then(function(response) {
            if (response.items.length > 0) {
                return utils.formFailure(event.target, "ID '"+nextId+"' already exists.");
            }
            params.vm.createFromNew(nextId);
            root.closeDialog();
        });
    };
};