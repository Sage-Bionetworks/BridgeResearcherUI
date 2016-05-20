var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');

module.exports = function(propertyName) {
    return function () {
        var self = this;
        self.study = null;
        self.records = ko.observableArray();
        self.addField = ko.observable("");
        self.noChanges = ko.observable(true);

        self.keyHandler = function(view, e) {
            if (e.keyCode === 13) {
                self.add();
                return false;
            }
            return true;
        };
        self.remove = function(attribute) {
            self.records.remove(attribute);
            self.noChanges(false);
        };
        self.add = function() {
            if (!self.addField()) {
                return root.message('warning', 'A value is required.');
            }
            if (self.records.contains(self.addField())) {
                return root.message('warning', 'The value must be unique.');
            }
            // If it's a dataGroup entry, it has to meet some string validation criteria.
            if (propertyName === "dataGroups" && !/^[a-zA-Z0-9_-]+$/.test(self.addField())) {
                return root.message('warning', 'The value can only be letters, numbers, underscores and dashes.');
            }

            self.records.push(self.addField());
            self.addField("");
            self.noChanges(false);
        };
        self.save = function(vm, event) {
            utils.startHandler(self, event);
            self.study[propertyName] = self.records();

/*
            if (typeof self.study[propertyName] === "undefined" ||
                    self.study[propertyName].length < 1) {
                delete self.study[propertyName];
            }*/
            serverService.saveStudy(self.study)
                    .then(function(response) {
                        self.noChanges(true);
                        self.study[propertyName] = [];
                    })
                    .then(utils.successHandler(self, event, "Values saved."))
                    .catch(utils.failureHandler(vm, event));
        };

        serverService.getStudy()
            .then(function(study) {
                self.study = study;
                self.records.pushAll(study[propertyName]);
            })
            .catch(utils.failureHandler());
    };
};
