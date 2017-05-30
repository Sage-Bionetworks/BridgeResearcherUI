var bind = require('../../binder');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var fn = require('../../functions');

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .bind('showIdentifier', typeof params.identifier === "undefined")
        .bind('identifier', params.identifier)
        .bind('date', new Date().toISOString().split("T")[0])
        .bind('data');

    self.close = params.closeDialog;

    function addReport(entry) {
        return (params.type === "participant") ?
            serverService.addParticipantReport(params.userId, entry.identifier, entry) :
            serverService.addStudyReport(entry.identifier, entry);
    }

    self.save = function(vm, event) {
        var entry = binder.persist({});
        try {
            entry.data = JSON.parse(entry.data);
        } catch(e) {
            // not JSON.
        }
        utils.deleteUnusedProperties(entry);
        if (!entry.identifier) {
            // Because we're going to create an "undefined" report or something if we
            // don't stop here.
            return utils.failureHandler(vm, event)({
                responseJSON: {errors: {identifier: ["identifier is required"]}}
            });
        }
        utils.startHandler(vm, event);

        addReport(entry)
            .then(self.close)
            .then(utils.successHandler(vm, event))
            .catch(utils.dialogFailureHandler(vm, event));
    };
    
};