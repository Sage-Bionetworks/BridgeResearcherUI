var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');
var optionsService = require('../../services/options_service');
var config = require('../../config');

var fields = ['email', 'study', 'environment', 'study'];

module.exports = function() {
    var self = this;

    var study = optionsService.get('study', 'api');
    var env = optionsService.get('environment', 'production');

    self.message = ko.observable("");
    utils.observablesFor(self, fields);
    self.study(study);
    self.studyOptions = ko.observableArray();

    self.environmentOptions = config.environments;
    self.environment = ko.observable();
    self.environment.subscribe(utils.getStudyInfo(self));
    self.environment(env);

    self.sendResetPasswordRequest = function() {
        if (self.email() === "") {
            return self.message({text:"Email address is required.", status:"error"});
        }
        optionsService.set('environment', self.environment());
        optionsService.set('study', self.study());

        utils.startHandler(self, event);

        serverService.requestResetPassword(self.environment(), {
            email: self.email(), study: self.study()
        })
        .then(utils.successHandler(self, event))
        .then(function(response) {
            utils.eventbus.emit('dialogs', 'sign_in_dialog');
        })
        .catch(utils.failureHandler(self, event));

    };
    self.cancel = function() {
        utils.eventbus.emit('dialogs', 'sign_in_dialog');
    };
};