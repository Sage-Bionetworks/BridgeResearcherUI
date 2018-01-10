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

module.exports = function(params) {
    var self = this;
    var isLocked = fn.isNotBlank(root.queryParams.study);

    var studyKey, env;
    if (isLocked) {
        studyKey = root.queryParams.study;
        env = 'production';
    } else {
        studyKey = params.studyKey;
        env = params.env;
    }
    new Binder(self)
        .obs('title', params.studyName)
        .obs('token', '')
        .obs('isLocked', isLocked);
    
    function openSignInDialog() {
        root.openDialog('sign_in_dialog');
    }
    function clear(response) {
        self.tokenObs("");
        root.closeDialog();
        return response;
    }

    self.signIn = function(vm, event) {
        var model = params;
        model.token = self.tokenObs().replace(/[^\d]/g,'');

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
        var reloadIfNeeded = makeReloader(studyKey, params.env);

        utils.startHandler(vm, event);
        return serverService.phoneSignIn(params.studyName, params.env, model)
            .then(clear)
            .then(reloadIfNeeded)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler({transient:false}));
    };
    self.cancel = openSignInDialog;
};