import {serverService} from '../../services/server_service';
import Binder from '../../binder';

module.exports = function() {
    let binder = new Binder(this)
        .obs('emailVerificationEnabled')
        .obs('emailSignInEnabled');
    serverService.getStudy().then(binder.update());
};