var storeService = require('../../services/store_service');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var config = require('../../config');
var root = require('../../root');

var fields = ['username', 'password', 'study', 'environment', 'studyOptions[]'];

function findStudyName(studies, studyIdentifier) {
    return (studies || []).filter(function(studyOption) {
        return (studyOption.identifier === studyIdentifier);
    })[0].name;
}

module.exports = function() {
    var self = this;

    var studyKey = storeService.get('studyKey') || 'api';
    var env = storeService.get('environment') || 'production';

    utils.observablesFor(self, fields);
    self.studyObs(studyKey);
    self.environmentOptions = config.environments;

    self.environmentObs.subscribe(function(newValue) {
        self.studyOptionsObs({name:'Updating...',identifier:''});
        serverService.getStudyList(newValue)
            .then(function(studies){
                self.studyOptionsObs(studies.items);
                self.studyObs(studyKey);
            }).catch(utils.failureHandler(self));
    });
    self.environmentObs(env);

    function clear(response) {
        self.usernameObs("");
        self.passwordObs("");
        if (!response.isSupportedUser()) {
            root.message('error', 'You do not appear to be a developer, researcher, or admin.');
            return;
        } else {
            root.closeDialog();
        }
        return response;
    }

    self.signIn = function(vm, event) {
        if (self.usernameObs() === "" || self.passwordObs() === "") {
            root.message('error', 'Username and/or password are required.');
            return;
        }
        // Succeed or fail, let's keep these values for other sign ins.
        storeService.set('environment', self.environmentObs());
        storeService.set('studyKey', self.studyObs());

        utils.startHandler(self, event);

        var studyName = findStudyName(self.studyOptionsObs(), self.studyObs());
        serverService.signIn(studyName, self.environmentObs(), {
            username: self.usernameObs(), password: self.passwordObs(), study: self.studyObs()
        })
        .then(clear)
        .then(utils.successHandler(self, event))
        .catch(utils.failureHandler(self, event));
    };

    self.forgotPassword = function() {
        root.openDialog('forgot_password_dialog');
    };

};