var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');

// TODO: There's much simpler code to do this in the password policy screen.
// Why did that work and why can't it be used here?

function partialRelayUpdater(vm, eventObj) {
    return function(func) {
        return function(newValue) {
            var crit = vm.criteriaObs();
            func(crit, newValue);
            if (eventObj) {
                eventObj.notifySubscribers(eventObj());
            }
        };
    };
}

/**
 * Params
 *  id - the id root to use for error message HTML ids
 *  criteriaObs - the criteria observer
 *  eventObj: an optional object on which to call a notifySubscribers event, if listening
 *      to criteriaObs directly is not enough to update external components.
 */
module.exports = function(params) {
    var self = this;

    self.id = params.id;
    self.criteriaObs = params.criteriaObs;
    var binder = bind(self)
        .bind('minAppVersion')
        .bind('maxAppVersion')
        .bind('language')
        .bind('allOfGroups[]')
        .bind('noneOfGroups[]')
        .obs('dataGroupsOptions[]');

    var updateVM = binder.update();

    var crit = self.criteriaObs();
    if (crit) {
        updateVM(crit);    
    }
    
    var updater = partialRelayUpdater(self, params.eventObj);
    
    self.criteriaObs.subscribe(function(newValue) {
        updateVM(newValue);
    });
    self.languageObs.subscribe(updater(function(crit, newValue) {
        crit.language = newValue;
    }));
    self.allOfGroupsObs.subscribe(updater(function(crit, newValue) {
        crit.allOfGroups = newValue;
    }));
    self.noneOfGroupsObs.subscribe(updater(function(crit, newValue) {
        crit.noneOfGroups = newValue;
    }));
    self.minAppVersionObs.subscribe(updater(function(crit, newValue) {
        crit.minAppVersion = (utils.isNotBlank(newValue)) ? parseInt(newValue,10) : null;
    }));
    self.maxAppVersionObs.subscribe(updater(function(crit, newValue) {
        crit.maxAppVersion = (utils.isNotBlank(newValue)) ? parseInt(newValue,10) : null;
    }));

    serverService.getStudy().then(function(study) {
        self.dataGroupsOptionsObs(study.dataGroups);
    });
};
