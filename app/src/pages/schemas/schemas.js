'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);
    self.itemsObs = ko.observableArray([]);

    serverService.getAllUploadSchemas().then(function(response) {
        if (response.items.length) {
            response.items.sort(utils.makeFieldSorter("name"));
            self.itemsObs(response.items);
        } else {
            document.querySelector(".loading_status").textContent = "There are currently no upload schemas.";
        }
    });
};