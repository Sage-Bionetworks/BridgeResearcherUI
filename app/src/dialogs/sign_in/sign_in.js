var ko = require('knockout');
var optionsService = require('../../services/options_service');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var config = require('../../config');

var fields = ['username', 'password', 'study', 'environment'];

function findStudyName(studies, studyIdentifier) {
    return studies.filter(function(studyOption) {
        return (studyOption.identifier === studyIdentifier);
    })[0].name;
}

module.exports = function() {
    var self = this;

    var study = optionsService.get('study', 'api');
    var env = optionsService.get('environment', 'production');

    self.messageObs = ko.observable("");
    utils.observablesFor(self, fields);
    self.study(study);
    self.studyOptions = ko.observableArray();

    self.environmentOptions = config.environments;
    self.environment = ko.observable();
    self.environment.subscribe(utils.getStudyList(self));
    self.environment(env);

    self.signIn = function(vm, event) {
        if (self.username() === "" || self.password() === "") {
            return self.messageObs({text:"Username and/or password are required.", status:"error"});
        }
        // Succeed or fail, let's keep these values for other sign ins.
        optionsService.set('environment', self.environment());
        optionsService.set('study', self.study());

        utils.startHandler(self, event);

        var studyName = findStudyName(self.studyOptions(), self.study());
        serverService.signIn(studyName, self.environment(), {
            username: self.username(), password: self.password(), study: self.study()
        })
        .then(utils.successHandler(self, event))
        .then(function(response) {
            self.username("");
            self.password("");
        })
        .catch(utils.failureHandler(self, event));
    };

    self.forgotPassword = function() {
        utils.eventbus.emit('dialogs', 'forgot_password_dialog');
    };

};