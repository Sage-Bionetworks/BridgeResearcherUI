var serverService = require('../../services/server_service');
var fn = require('../../functions');
var bind = require('../../binder');

function partialRelay(criteriaObs) {
    return function(func) {
        return function(newValue) {
            var crit = criteriaObs();
            func(crit, newValue);
            criteriaObs(crit);
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

    var relay = partialRelay(self.criteriaObs);

    self.languageObs.subscribe(relay(function(crit, newValue) {
        crit.language = newValue;
    }));

    self.languageObs.subscribe(relay(function(crit, newValue) {
        crit.language = newValue;
    }));
    self.allOfGroupsObs.subscribe(relay(function(crit, newValue) {
        crit.allOfGroups = newValue;
    }));
    self.noneOfGroupsObs.subscribe(relay(function(crit, newValue) {
        crit.noneOfGroups = newValue;
    }));
    self.iosMinObs.subscribe(relay(function(crit, newValue) {
        crit.minAppVersions['iPhone OS'] = intValue(newValue);
    }));
    self.iosMaxObs.subscribe(relay(function(crit, newValue) {
        crit.maxAppVersions['iPhone OS'] = intValue(newValue);
    }));
    self.androidMinObs.subscribe(relay(function(crit, newValue) {
        crit.minAppVersions.Android = intValue(newValue);
    }));
    self.androidMaxObs.subscribe(relay(function(crit, newValue) {
        crit.maxAppVersions.Android = intValue(newValue);
    }));

    function intValue(newValue) {
        return (fn.isNotBlank(newValue)) ? parseInt(newValue,10) : null;
    }

    serverService.getStudy().then(function(study) {
        self.dataGroupsOptionsObs(study.dataGroups);

        var crit = self.criteriaObs();
        if (crit) {
            updateVM(crit);    
        }
        var sub = self.criteriaObs.subscribe(function(newValue) {
            sub.dispose();
            updateVM(newValue);
        });
    });
};
