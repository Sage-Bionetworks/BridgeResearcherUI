var utils = require('../../utils');
var serverService = require('../../services/server_service');

var fields = ['message', 'name', 'sponsorName', 'technicalEmail', 'supportEmail',
    'consentNotificationEmail', 'identifier', 'strictUploadValidationEnabled', 'minIos', 'minAndroid'];

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

    utils.observablesFor(self, fields);

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        utils.observablesToObject(self, self.study, fields);

        self.study.minSupportedAppVersions = {};
        updateMinAppVersion(self, self.minIosObs, "iPhone OS");
        updateMinAppVersion(self, self.minAndroidObs, "Android");

        serverService.saveStudy(self.study)
            .then(function(response) {
                self.study.version = response.version;
            })
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler(vm, event));
    };
    self.publicKey = function() {
        if (self.study) {
            // It finds this and it works...
            require('../../root').openDialog('publickey', {study: self.study});
        }
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
        updateMinAppObservers(study, self.minIosObs, 'iPhone OS');
        updateMinAppObservers(study, self.minAndroidObs, 'Android');
    });
};
