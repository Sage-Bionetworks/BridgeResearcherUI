import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import config from '../../config';
import fn from '../../functions';
import root from '../../root';
import serverService from '../../services/server_service';
import storeService from '../../services/store_service';
import utils from '../../utils';

const STUDY_KEY = 'studyKey';
const ENVIRONMENT = 'environment';

// There will be stale data in the UI if we don't reload when changing studies or environments.
function makeReloader(studyKey, environment) {
    var requiresReload = (storeService.get(STUDY_KEY) !== studyKey || 
                          storeService.get(ENVIRONMENT) !== environment);
    return (requiresReload) ?
        function(response) {
            window.location.reload(); 
        } : fn.identity;
}

module.exports = function() {
    var self = this;
    var signInSubmit = document.querySelector("#signInSubmit");
    var isLocked = fn.isNotBlank(root.queryParams.study);
    
    var studyKey, env;    
    if (isLocked) {
        studyKey = root.queryParams.study;
        env = 'production';
    } else {
        studyKey = storeService.get(STUDY_KEY) || 'api';
        env = storeService.get(ENVIRONMENT) || 'production';
    }
    new Binder(self)
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
            self.titleObs(utils.findStudyName(self.studyOptionsObs(), studyKey));
        }
    }
    function loadStudyList(newValue) {
        return serverService.getStudyList(newValue)
            .then(loadStudies)
            .catch(utils.failureHandler());
    }
    function clear(response) {
        self.usernameObs("");
        self.passwordObs("");
        root.closeDialog();
        return response;
    }

    self.signIn = function(vm, event) {
        var credentials = {
            username: self.usernameObs(), 
            password: self.passwordObs(), 
            study: self.studyObs()
        };
        var error = new BridgeError();
        if (credentials.username === "") {
            error.addError("email", "is required");
        }
        if (credentials.password === "") {
            error.addError("password", "is required");
        }
        if (error.hasErrors()) {
            return utils.failureHandler({transient:false})(error);
        }

        var studyKey = self.studyObs();
        var environment = self.environmentObs();
        var reloadIfNeeded = makeReloader(studyKey, environment);

        // Succeed or fail, let's keep these values for other sign ins.
        storeService.set(STUDY_KEY, studyKey);
        storeService.set(ENVIRONMENT, environment);

        utils.startHandler(self, {target: signInSubmit});
        var studyName = utils.findStudyName(self.studyOptionsObs(), studyKey);
        
        serverService.signIn(studyName, environment, credentials)
            .then(clear)
            .then(reloadIfNeeded)
            .then(utils.successHandler(self, {target: signInSubmit}))
            .catch(utils.failureHandler({transient:false}));
    };

    self.forgotPassword = function() {
        root.openDialog('forgot_password_dialog');
    };
};