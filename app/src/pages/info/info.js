var utils = require('../../utils');
var serverService = require('../../services/server_service');
var ko = require('knockout');

var fields = ['message', 'name', 'sponsorName', 'technicalEmail', 'supportEmail', 'consentNotificationEmail',
    'identifier', 'strictUploadValidationEnabled', 'minIos', 'minAndroid','externalIdValidationEnabled'];

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
    var root = require('../../root')

    utils.observablesFor(self, fields);

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        utils.observablesToObject(self, self.study, fields);

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

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
        updateMinAppObservers(study, self.minIosObs, 'iPhone OS');
        updateMinAppObservers(study, self.minAndroidObs, 'Android');
    });
};
