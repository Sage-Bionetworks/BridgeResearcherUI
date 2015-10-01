var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');
var optionsService = require('../../services/options_service');
var config = require('../../config');
var root = require('../../root');

var fields = ['email', 'study', 'environment', 'studyOptions[]'];

module.exports = function() {
    var self = this;

    var study = optionsService.get('study', 'api');
    var env = optionsService.get('environment', 'production');

    utils.observablesFor(self, fields);
    self.studyObs(study);

    self.environmentOptions = config.environments;
    self.environmentObs.subscribe(function(newValue) {
        self.studyOptionsObs([]);
        serverService.getStudyList(newValue)
                .then(function(studies){
                    self.studyOptionsObs(studies.items);
                }).catch(utils.failureHandler(self));
    });
    self.environmentObs(env);

    self.sendResetPasswordRequest = function(vm, event) {
        if (self.emailObs() === "") {
            root.message('error', "Email address is required.");
        }
        optionsService.set('environment', self.environmentObs());
        optionsService.set('study', self.studyObs());

        utils.startHandler(self, event);
        serverService.requestResetPassword(self.environmentObs(), {
            email: self.emailObs(), study: self.studyObs()
        })
        .then(function() {
            root.openDialog('sign_in_dialog');
        })
        .then(utils.successHandler(self, event, "An email has been sent to that address with instructions on changing your password."))
        .catch(utils.failureHandler(self, event));
    };
    self.cancel = function() {
        root.openDialog('sign_in_dialog');
    };
};