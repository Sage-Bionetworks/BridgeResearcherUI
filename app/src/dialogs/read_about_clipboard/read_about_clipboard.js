var ko = require('knockout');
var serverService = require('../../services/server_service');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.close = function(vm, event) {
        root.closeDialog();
    };
};
