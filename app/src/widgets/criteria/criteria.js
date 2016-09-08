var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');

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
        .bind('language')
        .bind('allOfGroups[]')
        .bind('noneOfGroups[]')
        .obs('iosMin')
        .obs('iosMax')
        .obs('androidMin')
        .obs('androidMax')
        .obs('dataGroupsOptions[]');

    function updateVM(crit) {
        crit.minAppVersions = crit.minAppVersions || {};
        crit.maxAppVersions = crit.maxAppVersions || {};
        binder.update()(crit);
        self.iosMinObs(crit.minAppVersions['iPhone OS']);
        self.iosMaxObs(crit.maxAppVersions['iPhone OS']);
        self.androidMinObs(crit.minAppVersions.Android);
        self.androidMaxObs(crit.maxAppVersions.Android);
    }

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
    self.iosMinObs.subscribe(updater(function(crit, newValue) {
        crit.minAppVersions['iPhone OS'] = intValue(newValue);
    }));
    self.iosMaxObs.subscribe(updater(function(crit, newValue) {
        crit.maxAppVersions['iPhone OS'] = intValue(newValue);
    }));
    self.androidMinObs.subscribe(updater(function(crit, newValue) {
        crit.minAppVersions.Android = intValue(newValue);
    }));
    self.androidMaxObs.subscribe(updater(function(crit, newValue) {
        crit.maxAppVersions.Android = intValue(newValue);
    }));

    function intValue(newValue) {
        return (utils.isNotBlank(newValue)) ? parseInt(newValue,10) : null;
    }

    serverService.getStudy().then(function(study) {
        self.dataGroupsOptionsObs(study.dataGroups);
    });
};
