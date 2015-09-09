'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('./schema_utils');
var utils = require('../../utils');

function addCheckedObs(item) {
    item.checkedObs = ko.observable(false);
    return item;
}

module.exports = function(params) {
    var self = this;

    self.nameObs = ko.observable();
    self.messageObs = ko.observable();
    self.schemaIdObs = ko.observable(params.schemaId);
    self.itemsObs = ko.observableArray([]);

    self.anyChecked = function() {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    };
    self.deleteRevisions = function() {
        console.log("Deleted");
    };

    // There's only one call for this; weed out the versions for this ID
    serverService.getAllUploadSchemas().then(function(response) {
        self.itemsObs(response.items.map(addCheckedObs));
    });
};