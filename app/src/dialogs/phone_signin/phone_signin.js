import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import config from '../../config';
import fn from '../../functions';
import root from '../../root';
import storeService from '../../services/store_service';
import utils from '../../utils';

var SUCCESS_MSG = "An SMS message has been sent to that phone number; enter the code to sign in.";
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
    var isLocked = fn.isNotBlank(root.queryParams.study);

    var studyKey, env;
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
        .obs('token', '')
        .obs('study', studyKey)
        .obs('environment', env)
        .obs('studyOptions[]')
        .obs('tokenSent', false)
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
    function tokenHasBeenSent() {
        self.tokenSentObs(true);
    }
    function loadStudyList(newValue) {
        serverService.getStudyList(newValue)
            .then(loadStudies)
            .catch(utils.failureHandler());
    }
    function openSignInDialog() {
        root.openDialog('sign_in_dialog');
    }
    function clear(response) {
        self.phoneObs("");
        self.phoneRegionObs("US");
        self.tokenObs("");
        self.tokenSentObs(false);
        root.closeDialog();
        return response;
    }

    self.sendPhoneSignInRequest = function(vm, event) {
        var env = self.environmentObs();
        var model = {phone: {number: self.phoneObs(), regionCode: self.phoneRegionObs()}, study: self.studyObs()};
        
        var error = new BridgeError();
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
            .then(tokenHasBeenSent)
            .then(utils.successHandler(vm, event, SUCCESS_MSG))
            .catch(utils.failureHandler());
    };
    self.signIn = function(vm, event) {
        var env = self.environmentObs();
        var model = {
            phone: {number: self.phoneObs(), regionCode: self.phoneRegionObs()}, 
            study: self.studyObs(), 
            token: self.tokenObs().replace(/[^\d]/g,'')
        };

        var error = new BridgeError();
        if (!model.phone.number) {
            error.addError("phone", "is required");
        }
        if (!model.phone.regionCode) {
            error.addError("phoneRegion", "is required");
        }
        if (!model.token) {
            error.addError("token", "is required");
        }
        if (!/\d{6,6}/.test(model.token)) {
            error.addError("token", "does not appear to be a valid code");
        }
        if (error.hasErrors()) {
            return utils.failureHandler()(error);
        }
        var reloadIfNeeded = makeReloader(studyKey, env);
        var studyName = utils.findStudyName(self.studyOptionsObs(), studyKey);

        utils.startHandler(vm, event);
        return serverService.phoneSignIn(studyName, env, model)
            .then(clear)
            .then(reloadIfNeeded)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler({transient:false}));
    };

    self.updateRegion = function(model, event) {
        if(event.target.classList.contains("item")) {
            self.phoneRegionObs(event.target.textContent);
        }
    };

    self.cancel = openSignInDialog;
};