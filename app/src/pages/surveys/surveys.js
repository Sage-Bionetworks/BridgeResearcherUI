var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.message = ko.observable("");
    self.items = ko.observableArray();

    self.createNew = function() {
        alert("Not implemented");
    };
    self.formatDate = utils.formatDate;

    serverService.getSurveys().then(function(list) {
        console.log(list);
        if (list.items.length) {
            self.items(list.items);
        } else {
            self.message({text:"There are currently no surveys.",status:"gray"});
        }
    });
};