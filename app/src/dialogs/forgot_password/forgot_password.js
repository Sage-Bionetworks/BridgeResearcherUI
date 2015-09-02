var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');
var optionsService = require('../../services/options_service');
var config = require('../../config');

var fields = ['email', 'study', 'environment'];

function openDialog() {
    utils.openDialog('sign_in_dialog');
}

module.exports = function() {
    var self = this;

    var study = optionsService.get('study', 'api');
    var env = optionsService.get('environment', 'production');

    self.messageObs = ko.observable("");
    utils.observablesFor(self, fields);
    self.studyObs(study);
    self.studyOptions = ko.observableArray();

    self.environmentOptions = config.environments;
    self.environmentObs.subscribe(utils.getStudyList(self));
    self.environmentObs(env);

    self.sendResetPasswordRequest = function() {
        if (self.emailObs() === "") {
            return self.messageObs({text:"Email address is required.", status:"error"});
        }
        optionsService.set('environment', self.environmentObs());
        optionsService.set('study', self.studyObs());

        utils.startHandler(self, event);

        serverService.requestResetPassword(self.environmentObs(), {
            email: self.emailObs(), study: self.studyObs()
        })
        .then(openDialog)
        .then(utils.successHandler(self, event))
        .catch(utils.failureHandler(self, event));
    };
    self.cancel = function() {
        utils.openDialog('sign_in_dialog');
    };
};