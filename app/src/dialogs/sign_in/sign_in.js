import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import config from '../../config';
import fn from '../../functions';
import root from '../../root';
import storeService from '../../services/store_service';
import utils from '../../utils';

const STUDY_KEY = 'studyKey';
const ENVIRONMENT = 'environment';

// There will be stale data in the UI if we don't reload when changing studies or environments.
function makeReloader(studyKey, environment) {
    let requiresReload = (storeService.get(STUDY_KEY) !== studyKey || 
                          storeService.get(ENVIRONMENT) !== environment);
    return (requiresReload) ?
        function(response) {
            window.location.reload(); 
        } : fn.identity;
}

module.exports = function() {
    let self = this;
    let signInSubmit = document.querySelector("button[form='signInForm']");
    let isLocked = fn.isNotBlank(root.queryParams.study);

    let studyKey, env;    
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
        .obs('focusEmail', false)
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
            .then(function() {
                setTimeout(function() {
                    self.focusEmailObs(true);
                }, 200);
            })
            .catch(utils.failureHandler());
    }
    function clear(response) {
        self.usernameObs("");
        self.passwordObs("");
        root.closeDialog();
        return response;
    }

    self.keypress = function(vm, event) {
        if (event.keyCode === 13) {
            self.signIn(vm, event);
            return false;
        }
        return true;
    };

    self.signIn = function(vm, event) {
        let credentials = {
            username: self.usernameObs(), 
            password: self.passwordObs(), 
            study: self.studyObs()
        };
        let error = new BridgeError();
        if (credentials.username === "") {
            error.addError("email", "is required");
        }
        if (credentials.password === "") {
            error.addError("password", "is required");
        }
        if (error.hasErrors()) {
            return utils.failureHandler({transient:false})(error);
        }

        let studyKey = self.studyObs();
        let environment = self.environmentObs();
        let reloadIfNeeded = makeReloader(studyKey, environment);

        // Succeed or fail, let's keep these values for other sign ins.
        storeService.set(STUDY_KEY, studyKey);
        storeService.set(ENVIRONMENT, environment);

        utils.startHandler(self, {target: signInSubmit});
        let studyName = utils.findStudyName(self.studyOptionsObs(), studyKey);
        
        serverService.signIn(studyName, environment, credentials)
            .then(clear)
            .then(reloadIfNeeded)
            .then(utils.successHandler(self, {target: signInSubmit}))
            .catch(utils.failureHandler({transient:false}));
    };

    self.usePhone = function(vm, event) {
        root.openDialog('phone_signin_dialog', {closeable:false});
    };
    self.forgotPassword = function() {
        root.openDialog('forgot_password_dialog', {closeable:false});
    };
};