import Binder from '../../binder';
import ko from 'knockout';
import root from '../../root';
import serverService  from '../../services/server_service';
import utils from '../../utils';

function updateMinAppVersion(vm, obs, name) {
    var value = parseInt(obs(),10);
    if (value >= 0) {
        vm.study.minSupportedAppVersions[name] = value;
    }
    obs(value);
}
function updateMinAppObservers(study, obs, name) {
    if (study.minSupportedAppVersions[name]) {
        obs(study.minSupportedAppVersions[name]);
    }
}
function zeroToMax(value) {
    return (value === 0) ? 121 : value;
}
function maxToZero(value) {
    return (value === "121") ? 0 : parseInt(value);
}

module.exports = function() {
    var self = this;

    var binder = new Binder(self)
        .obs('message')
        .obs('identifier')
        .obs('minIos')
        .obs('minAndroid')
        .bind('name')
        .bind('shortName')
        .bind('sponsorName')
        .bind('minAgeOfConsent', null, zeroToMax, maxToZero);
    
    self.minAgeLabel = ko.computed(function(){
        return (self.minAgeOfConsentObs() == "121") ? "No age limit" : self.minAgeOfConsentObs();
    });

    self.isPublicObs = root.isPublicObs;
    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study = binder.persist(self.study);

        self.study.minSupportedAppVersions = {};
        updateMinAppVersion(self, self.minIosObs, "iPhone OS");
        updateMinAppVersion(self, self.minAndroidObs, "Android");

        serverService.saveStudy(self.study, false)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler());
    };
    self.publicKey = function() {
        if (self.study) {
            root.openDialog('publickey', {study: self.study});
        }
    };

    function updateObservers(study) {
        updateMinAppObservers(study, self.minIosObs, 'iPhone OS');
        updateMinAppObservers(study, self.minAndroidObs, 'Android');
    }

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .then(updateObservers)
        .catch(utils.failureHandler());
};
module.exports.prototype.dispose = function() {
    this.minAgeLabel.dispose();
};