var ko = require('knockout');
var serverService = require('../services/server_service');

module.exports = function() {
    var self = this;

    self.study;
    self.passwordPolicy = ko.observable();
    self.minLengths = ko.observableArray([2,3,4,5,6,7,8,9,10,11,12,13,14]);

    serverService.getStudy().then(function(study) {
        self.study = study;
        self.passwordPolicy(study.passwordPolicy);
    });

    self.save = function(passwordPolicy, event) {
        event.preventDefault();
        self.study.passwordPolicy = passwordPolicy;

        serverService.saveStudy(self.study).then(function(response) {
            self.study.version = response.version;
        });
    };
};