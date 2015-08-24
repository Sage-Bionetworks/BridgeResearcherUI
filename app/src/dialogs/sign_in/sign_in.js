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
    self.studyObs(study);
    self.studyOptions = ko.observableArray();

    self.environmentOptions = config.environments;
    self.environmentObs.subscribe(utils.getStudyList(self));
    self.environmentObs(env);

    function clear() {
        self.usernameObs("");
        self.passwordObs("");
    }

    self.signIn = function(vm, event) {
        if (self.usernameObs() === "" || self.passwordObs() === "") {
            return self.messageObs({text:"Username and/or password are required.", status:"error"});
        }
        // Succeed or fail, let's keep these values for other sign ins.
        optionsService.set('environment', self.environmentObs());
        optionsService.set('study', self.studyObs());

        utils.startHandler(self, event);

        var studyName = findStudyName(self.studyOptions(), self.studyObs());
        serverService.signIn(studyName, self.environmentObs(), {
            username: self.usernameObs(), password: self.passwordObs(), study: self.studyObs()
        })
        .then(clear)
        .then(utils.successHandler(self, event))
        .catch(utils.failureHandler(self, event));
    };

    self.forgotPassword = function() {
        utils.openDialog('forgot_password_dialog');
    };

};