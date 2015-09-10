'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');

function nameSorter(a,b) {
    return a.name.toLowerCase() > b.name.toLowerCase();
}

module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);
    self.messageObs = ko.observable("");
    self.itemsObs = ko.observableArray([]);

    serverService.getAllUploadSchemas().then(function(response) {
        if (response.items.length) {
            response.items.sort(nameSorter);
            self.itemsObs(response.items);
        } else {
            document.querySelector(".loading.status").textContent = "There are currently no upload schemas.";
        }
    });
};