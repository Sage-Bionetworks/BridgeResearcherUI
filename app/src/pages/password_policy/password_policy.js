var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.study = null;
    self.passwordPolicyObs = ko.observable();
    self.minLengthsObs = ko.observableArray([2,3,4,5,6,7,8,9,10,11,12,13,14]);

    serverService.getStudy().then(function(study) {
        self.study = study;
        self.passwordPolicyObs(study.passwordPolicy);
    });

    self.save = function(vm, event) {
        utils.startHandler(vm, event);
        self.study.passwordPolicy = vm.passwordPolicyObs();

        serverService.saveStudy(self.study)
            .then(function(response) {
                self.study.version = response.version;
            })
            .then(utils.successHandler(vm, event, "Password policy has been saved."))
            .catch(utils.failureHandler(vm, event));
    };
};