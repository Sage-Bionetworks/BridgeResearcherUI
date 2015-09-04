'use strict';

var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.messageObs = ko.observable("");
    self.itemsObs = ko.observableArray([]);
    self.formatDateTime = utils.formatDateTime;

    serverService.getSurveys().then(function(list) {
        if (list.items.length) {
            self.itemsObs(list.items);
        } else {
            document.querySelector(".loading.status").textContent = "There are currently no surveys.";
        }
    });
};