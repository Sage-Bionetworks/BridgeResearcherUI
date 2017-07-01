import { Binder } from '../../binder';
import { fn } from '../../functions';
import { root } from '../../root';
import { serverService }  from '../../services/server_service';
import { utils } from '../../utils';

module.exports = function(propertyName) {
    return function () {
        var self = this;
        
        var binder = new Binder(self)
            .obs('records[]')
            .obs('newRecords[]')
            .obs('addField')
            .obs('noChanges', true);

        self.isPublicObs = root.isPublicObs;
        self.keyHandler = function(view, e) {
            if (e.keyCode === 13) {
                self.add();
                return false;
            }
            return true;
        };
        self.remove = function(attribute) {
            self.newRecordsObs.remove(attribute);
            self.noChangesObs(false);
        };
        self.add = function() {
            // TODO: We don't want to use root.message like this. We want to create an error
            // object and show like any other entity validation exception, as we do elsewhere.
            if (!self.addFieldObs()) {
                return root.message('warning', 'A value is required.');
            }
            if (self.recordsObs.contains(self.addFieldObs()) || 
                self.newRecordsObs.contains(self.addFieldObs())) {
                return root.message('warning', 'The value must be unique.');
            }
            // If it's a dataGroup entry, it has to meet some string validation criteria.
            if (propertyName === "dataGroups" && !/^[a-zA-Z0-9_-]+$/.test(self.addFieldObs())) {
                return root.message('warning', 'The value can only be letters, numbers, underscores and dashes.');
            }
            var array = self.newRecordsObs();
            array.push(self.addFieldObs());
            array.sort(fn.lowerCaseStringSorter);
            self.newRecordsObs(array);
            self.addFieldObs("");
            self.noChangesObs(false);
        };
        self.save = function(vm, event) {
            var array = [].concat(self.recordsObs());
            self.newRecordsObs().forEach(function(identifier) {
                array.push(identifier);
            });

            utils.startHandler(self, event);
            self.study[propertyName] = array;
            serverService.saveStudy(self.study)
                .then(serverService.getStudy)
                .then(updateTaskIdentifiers)
                .then(fn.handleStaticObsUpdate(self.noChangesObs, true))
                .then(utils.successHandler(self, event, "Values saved."))
                .catch(utils.failureHandler({transient:false}));
        };

        function updateTaskIdentifiers(study) {
            self.newRecordsObs([]);
            study[propertyName].sort();
            self.recordsObs(study[propertyName]);
            return study;
        }

        serverService.getStudy()
            .then(updateTaskIdentifiers)
            .then(binder.assign('study'))
            .catch(utils.failureHandler());
    };
};
