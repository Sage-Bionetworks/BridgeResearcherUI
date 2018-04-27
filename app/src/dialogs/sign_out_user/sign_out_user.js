import {serverService} from '../../services/server_service';
import BridgeError from '../../bridge_error';
import ko from 'knockout';
import root from '../../root';
import utils from '../../utils';

module.exports = function(params) {
    let self = this;

    self.cancel = root.closeDialog;
    self.signOutOptionObs = ko.observable('true');

    self.signOutUser = function(vm, event) {
        utils.startHandler(vm, event);
        
        let deleteReauthToken = self.signOutOptionObs() === 'true';
        serverService.signOutUser(params.userId, deleteReauthToken)
            .then(utils.successHandler(vm, event, "User signed out."))
            .then(self.cancel)
            .catch(utils.failureHandler());        
    };
};
