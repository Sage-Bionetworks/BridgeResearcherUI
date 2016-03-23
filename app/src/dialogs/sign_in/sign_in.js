var storeService = require('../../services/store_service');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var config = require('../../config');
var root = require('../../root');

var STUDY_KEY = 'studyKey';
var ENVIRONMENT = 'environment';
var fields = ['username', 'password', 'study', 'environment', 'studyOptions[]'];

function findStudyName(studies, studyIdentifier) {
    return (studies || []).filter(function(studyOption) {
        return (studyOption.identifier === studyIdentifier);
    })[0].name;
}
// There will be stale data in the UI if we don't reload when changing studies or environments.
function makeReloader(studyKey, environment) {
    var requiresReload = (storeService.get(STUDY_KEY) !== studyKey || 
                          storeService.get(ENVIRONMENT) !== environment);    
    return (requiresReload) ?
        function(response) { window.location.reload(); } : utils.identity;
}

module.exports = function() {
    var self = this;

    var studyKey = storeService.get(STUDY_KEY) || 'api';
    var env = storeService.get(ENVIRONMENT) || 'production';

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
        var studyKey = self.studyObs();
        var environment = self.environmentObs();
        var reloadIfNeeded = makeReloader(studyKey, environment);

        // Succeed or fail, let's keep these values for other sign ins.
        storeService.set(STUDY_KEY, studyKey);
        storeService.set(ENVIRONMENT, environment);

        utils.startHandler(self, event);

        var studyName = findStudyName(self.studyOptionsObs(), studyKey);
        serverService.signIn(studyName, environment, {
            username: self.usernameObs(), password: self.passwordObs(), study: studyKey
        })
        .then(clear)
        .then(reloadIfNeeded)
        .then(utils.successHandler(self, event))
        .catch(utils.failureHandler(self, event));
    };

    self.forgotPassword = function() {
        root.openDialog('forgot_password_dialog');
    };

};