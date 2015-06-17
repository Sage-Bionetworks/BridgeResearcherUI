var ko = require('knockout');
// var dialogService = require('../../services/dialog_service');
var optionsService = require('../../services/options_service');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var config = require('../../config');

var fields = ['username', 'password', 'study', 'environment'];

module.exports = function() {
    var self = this;

    var env = optionsService.get('environment', 'production');
    var study = optionsService.get('study', 'api');

    self.message = ko.observable("");
    utils.observablesFor(self, fields);
    self.environment(env);
    self.study(study);
    self.studyOptions = config.studies;

    self.signIn = function(vm, event) {
        if (self.username() === "" || self.password() === "") {
            return self.message({text:"Username and/or password are required.", status:"error"});
        }
        // Succeed or fail, let's keep these values for other sign ins.
        optionsService.set('environment', self.environment());
        optionsService.set('study', self.study());

        utils.startHandler(self, event);

        serverService.signIn(env, {
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
        alert("not implemented");
    };

};