var bind = require('../../binder');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .bind('showIdentifier', typeof params.identifier === "undefined")
        .bind('identifier', params.identifier)
        .bind('date', new Date().toISOString().split("T")[0])
        .bind('data');

    self.save = function(vm, event) {
        var entry = binder.persist({});
        try {
            entry.data = JSON.stringify(JSON.parse(entry.data));
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

        var promise = (params.type === "participant") ?
            serverService.addParticipantReport(entry.identifier, params.userId, entry) :
            serverService.addStudyReport(entry.identifier, entry);
        promise.then(utils.successHandler(vm, event))
                .then(self.close)
                .catch(utils.dialogFailureHandler(vm, event));
    };
    self.close = function(response) {
        params.closeDialog();
        return response;
    };
};