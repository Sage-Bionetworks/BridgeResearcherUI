var ko = require('knockout');
var serverService = require('../services/server_service');

module.exports = function() {
    var self = this;

    self.study = null;
    self.records = ko.observableArray();
    self.addField = ko.observable("");

    self.remove = function(attribute) {
        self.records.remove(attribute);
    };
    self.add = function() {
        self.records.push(self.addField());
        self.addField("");
    };
    self.save = function() {
        self.study.userProfileAttributes = self.records();

        var request = serverService.saveStudy(self.study);
        request.then(function(response) {
            self.study.version = response.version;
        });
        // TODO: Consolidate error handling.
        request.catch(function(response) {
            console.error("ERROR", request);
        });
    };

    var request = serverService.getStudy();
    request.then(function(study) {
        self.study = study;

        self.records.pushAll(study.userProfileAttributes);
    });
    request.catch(function(request) {
        console.error("ERROR", request);
    });

};