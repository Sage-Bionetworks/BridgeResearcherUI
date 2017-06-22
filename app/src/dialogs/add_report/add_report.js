var bind = require('../../binder');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var fn = require('../../functions');
var BridgeError = require('../../error');

function getLocalDate(value) {
    return fn.asDate(value).toISOString().split("T")[0];
}

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .obs('showIdentifier', typeof params.identifier === "undefined")
        .bind('identifier', params.identifier)
        .bind('date', new Date().toISOString().split("T")[0], null, getLocalDate)
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

        var error = new BridgeError();
        if (!entry.identifier) {
            error.addError("identifier", "is required");
        }
        if (!entry.data) {
            error.addError("data", "is required");
        }
        if (error.hasErrors()) {
            return utils.failureHandler()(error);
        }

        utils.startHandler(vm, event);
        addReport(entry)
            .then(self.close)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler());
    };
    
};