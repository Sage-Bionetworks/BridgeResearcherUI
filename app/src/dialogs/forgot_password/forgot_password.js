import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import config from '../../config';
import fn from '../../functions';
import root from '../../root';
import storeService from '../../services/store_service';
import utils from '../../utils';

const SUCCESS_MSG = "An email has been sent to that address with instructions on changing your password.";

module.exports = function() {
    let self = this;
    let fpButton = document.querySelector("#fpButton");
    let isLocked = fn.isNotBlank(root.queryParams.study);
    let studyKey, env;    
    if (isLocked) {
        studyKey = root.queryParams.study;
        env = 'production';
    } else {
        studyKey = storeService.get('studyKey') || 'api';
        env = storeService.get('environment') || 'production';
    }
    new Binder(self)
        .obs('email')
        .obs('title')
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
        serverService.getStudyList(newValue)
            .then(loadStudies)
            .catch(utils.failureHandler());
    }
    function openSignInDialog() {
        root.openDialog('sign_in_dialog', {closeable:false});
    }

    self.sendResetPasswordRequest = function(vm, event) {
        let env = self.environmentObs();
        let model = {email: self.emailObs(), study: self.studyObs()};
        
        let error = new BridgeError();
        if (!model.email) {
            error.addError("email", "is required");
        }
        if (!model.study) {
            error.addError("study", "is required");
        }
        if (error.hasErrors()) {
            return utils.failureHandler()(error);
        }

        storeService.set('environment', self.environmentObs());
        storeService.set('studyKey', self.studyObs());

        utils.startHandler(self, {target: fpButton});
        return serverService.requestResetPassword(env, model)
            .then(openSignInDialog)
            .then(utils.successHandler(self, {target: fpButton}, SUCCESS_MSG))
            .catch(utils.failureHandler());
    };

    self.cancel = openSignInDialog;
};