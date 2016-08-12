var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');

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

module.exports = function() {
    var self = this;

    // This cannot be loaded sooner, at the top of the file. Just plain don't work. Why? WHY?!
    var root = require('../../root');

    var binder = bind(self)
        .obs('message')
        .obs('identifier')
        .obs('minIos')
        .obs('minAndroid')
        .bind('name')
        .bind('sponsorName')
        .bind('strictUploadValidationEnabled');

    self.isPublicObs = root.isPublicObs;
    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study = binder.persist(self.study);

        self.study.minSupportedAppVersions = {};
        updateMinAppVersion(self, self.minIosObs, "iPhone OS");
        updateMinAppVersion(self, self.minAndroidObs, "Android");

        serverService.saveStudy(self.study, false)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler(vm, event));
    };
    self.publicKey = function() {
        if (self.study) {
            root.openDialog('publickey', {study: self.study});
        }
    };

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .then(function(study) {
            updateMinAppObservers(study, self.minIosObs, 'iPhone OS');
            updateMinAppObservers(study, self.minAndroidObs, 'Android');
        });
};
