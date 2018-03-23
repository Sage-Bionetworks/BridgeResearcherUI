import {serverService} from '../../services/server_service';
import ko from 'knockout';

module.exports = function() {
    let self = this;

    self.emailVerificationEnabledObs = ko.observable();
    self.emailSignInEnabledObs = ko.observable();

    serverService.getStudy().then((study) => {
        self.emailVerificationEnabledObs(study.emailVerificationEnabled);
        self.emailSignInEnabledObs(study.emailSignInEnabled);
    });

};