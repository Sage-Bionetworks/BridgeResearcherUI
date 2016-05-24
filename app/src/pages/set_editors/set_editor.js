var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
var bind = require('../../binder');

module.exports = function(propertyName) {
    return function () {
        var self = this;
        
        var binder = bind(self)
            .obs('records[]')
            .obs('addField')
            .obs('noChanges', true);

        self.keyHandler = function(view, e) {
            if (e.keyCode === 13) {
                self.add();
                return false;
            }
            return true;
        };
        self.remove = function(attribute) {
            self.recordsObs.remove(attribute);
            self.noChangesObs(false);
        };
        self.add = function() {
            if (!self.addFieldObs()) {
                return root.message('warning', 'A value is required.');
            }
            if (self.recordsObs.contains(self.addFieldObs())) {
                return root.message('warning', 'The value must be unique.');
            }
            // If it's a dataGroup entry, it has to meet some string validation criteria.
            if (propertyName === "dataGroups" && !/^[a-zA-Z0-9_-]+$/.test(self.addFieldObs())) {
                return root.message('warning', 'The value can only be letters, numbers, underscores and dashes.');
            }
            var array = self.recordsObs();
            array.push(self.addFieldObs());
            array.sort(utils.lowerCaseStringSorter);
            self.recordsObs(array);
            self.addFieldObs("");
            self.noChangesObs(false);
        };
        self.save = function(vm, event) {
            utils.startHandler(self, event);
            self.study[propertyName] = self.recordsObs();

            serverService.saveStudy(self.study)
                .then(function(response) {
                    self.noChangesObs(true);
                })
                .then(utils.successHandler(self, event, "Values saved."))
                .catch(utils.failureHandler(vm, event));
        };

        serverService.getStudy()
            .then(binder.assign('study'))
            .then(function(study) {
                self.recordsObs.pushAll(study[propertyName].sort());
            })
            .catch(utils.failureHandler());
    };
};
