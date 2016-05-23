'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    schemaUtils.initSchemasVM(self);
    self.itemsObs = ko.observableArray([]);
    /*
    function filterIosDataItems(item) {
        return item.schemaType === "ios_data";
    }*/

    serverService.getAllUploadSchemas().then(function(response) {
        var items = response.items
                //.filter(filterIosDataItems) there are actually people using the hand-crafted survey schemas
                .sort(utils.makeFieldSorter("name"));
        if (items.length) {
            self.itemsObs(items);
        } else {
            document.querySelector(".loading_status").textContent = "There are currently no upload schemas.";
        }
    });
};