var ko = require('knockout');
var serverService = require('../services/server_service');

module.exports = function() {
    var self = this;

    self.records = ko.observableArray();

    serverService.getStudy().then(function(study) {
        self.records.push(study);
    });

    self.save = function(study, event) {
        event.preventDefault();
        serverService.saveStudy(study).then(function(response) {
            self.records()[0].version = response.version;
        });
    };
};
