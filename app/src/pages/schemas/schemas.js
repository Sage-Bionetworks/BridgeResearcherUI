'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);
    self.messageObs = ko.observable("");
    self.itemsObs = ko.observableArray([]);

    serverService.getAllUploadSchemas().then(function(list) {
        if (list.items.length) {
            self.itemsObs(list.items);
        } else {
            document.querySelector(".loading.status").textContent = "There are currently no upload schemas.";
        }
    });
};