import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import config from '../../config';
import fn from '../../functions';
import root from '../../root';
import storeService from '../../services/store_service';
import utils from '../../utils';

const SUCCESS_MSG = "An SMS message has been sent to that phone number; enter the code to sign in.";
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
        .obs('phone')
        .obs('phoneRegion', 'US')
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
    function clear(response) {
        self.phoneObs("");
        self.phoneRegionObs("US");
        root.closeDialog();
        return response;
    }

    self.sendPhoneSignInRequest = function(vm, event) {
        let env = self.environmentObs();
        let studyName = utils.findStudyName(self.studyOptionsObs(), studyKey);
        let model = {
            phone: {number: self.phoneObs(), regionCode: self.phoneRegionObs()}, 
            study: self.studyObs(),
            env: env,
            studyName: studyName,
            studyKey: studyKey
        };
        
        let error = new BridgeError();
        if (!model.phone.number) {
            error.addError("phone", "is required");
        }
        if (!model.phone.regionCode) {
            error.addError("phoneRegion", "is required");
        }
        if (error.hasErrors()) {
            return utils.failureHandler()(error);
        }

        storeService.set('environment', self.environmentObs());
        storeService.set('studyKey', self.studyObs());

        utils.startHandler(vm, event);
        return serverService.requestPhoneSignIn(env, model)
            .then(function(request) {
                model.closeable = false;
                root.openDialog('submit_code_dialog', model);
            })
            .then(utils.successHandler(vm, event, SUCCESS_MSG))
            .catch(utils.failureHandler());
    };

    self.updateRegion = function(model, event) {
        if(event.target.classList.contains("item")) {
            self.phoneRegionObs(event.target.textContent);
        }
    };

    self.cancel = openSignInDialog;
};