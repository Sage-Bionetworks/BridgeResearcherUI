var storeService = require('../../services/store_service');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');
var config = require('../../config');
var root = require('../../root');

var STUDY_KEY = 'studyKey';
var ENVIRONMENT = 'environment';

function findStudyName(studies, studyIdentifier) {
    try {
        return (studies || []).filter(function(studyOption) {
            return (studyOption.identifier === studyIdentifier);
        })[0].name;
    } catch(e) {
        throw new Error("Study not found");
    }
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
    var signInSubmit = document.querySelector("#signInSubmit");
    var isLocked = utils.isDefined(root.queryParams.study);
    
    var studyKey, env;    
    if (isLocked) {
        studyKey = root.queryParams.study;
        env = 'production';
    } else {
        studyKey = storeService.get(STUDY_KEY) || 'api';
        env = storeService.get(ENVIRONMENT) || 'production';
    }
    bind(self)
        .obs('title')
        .obs('username')
        .obs('password')
        .obs('study', studyKey)
        .obs('environment', env)
        .obs('studyOptions[]')
        .obs('isLocked', isLocked);
    
    self.environmentOptions = config.environments;
    self.environmentObs.subscribe(function(newValue) {
        self.studyOptionsObs({name:'Updating...',identifier:''});
        loadStudyList(newValue);
    });
    loadStudyList(env);
    
    function loadStudies(studies){
        self.studyOptionsObs(studies.items);
        self.studyObs(studyKey);
        if (self.isLockedObs()) {
            self.titleObs(findStudyName(self.studyOptionsObs(), studyKey))
        }
    }
    
    function loadStudyList(newValue) {
        serverService.getStudyList(newValue)
            .then(loadStudies).catch(utils.failureHandler(self));
    }

    function clear(response) {
        self.usernameObs("");
        self.passwordObs("");
        if (!response.isSupportedUser()) {
            utils.formFailure(signInSubmit, 'You do not appear to be a developer, researcher, or admin.');
            return;
        } else {
            root.closeDialog();
        }
        return response;
    }

    self.signIn = function(vm, event) {
        if (self.usernameObs() === "" || self.passwordObs() === "") {
            utils.formFailure(signInSubmit, 'Username and/or password are required.');
            return;
        }
        var studyKey = self.studyObs();
        var environment = self.environmentObs();
        var reloadIfNeeded = makeReloader(studyKey, environment);

        // Succeed or fail, let's keep these values for other sign ins.
        storeService.set(STUDY_KEY, studyKey);
        storeService.set(ENVIRONMENT, environment);

        utils.startHandler(self, {target: signInSubmit});

        var studyName = findStudyName(self.studyOptionsObs(), studyKey);
        
        var credentials = {
            username: self.usernameObs(), password: self.passwordObs(), study: studyKey
        };
        
        serverService.signIn(studyName, environment, credentials)
            .then(clear)
            .then(reloadIfNeeded)
            .then(utils.successHandler(self, {target: signInSubmit}))
            .catch(utils.globalToFormFailureHandler(signInSubmit));
    };

    self.forgotPassword = function() {
        root.openDialog('forgot_password_dialog');
    };
};