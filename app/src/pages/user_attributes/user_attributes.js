var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.study = null;
    self.records = ko.observableArray();
    self.addField = ko.observable("");

    self.remove = function(attribute) {
        self.records.remove(attribute);
    };
    self.add = function() {
        if (!self.addField()) {
            return utils.message('warning', 'You must provide a value for an attribute.');
        }
        if (self.records.contains(self.addField())) {
            return utils.message('warning', 'The attribute must be a unique value.');
        }
        self.records.push(self.addField());
        self.addField("");
    };
    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study.userProfileAttributes = self.records();

        serverService.saveStudy(self.study)
            .then(function(response) {
                self.study.version = response.version;
            })
            .then(utils.successHandler(self, event, "User attributes saved."))
            .catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy()
        .then(function(study) {
            self.study = study;
            self.records.pushAll(study.userProfileAttributes);
        })
        .catch(function(request) {
            console.error("ERROR", request);
        });
};