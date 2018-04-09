import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import root from '../../root';
import utils from '../../utils';

module.exports = function(params) {
    let self = this;

    new Binder(self).obs('dateFormatting', localStorage.getItem('timezone') || 'local');

    self.cancel = root.closeDialog;
    
    self.save = function(vm, event) {
        localStorage.setItem('timezone', self.dateFormattingObs());
        self.cancel();
        setTimeout(() => {
            document.location.reload();
        }, 200);
    };
};
