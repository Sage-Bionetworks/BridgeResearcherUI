import {serverService} from '../../../services/server_service';
import Binder from '../../../binder';
import ko from 'knockout';
import root from '../../../root';
import utils from '../../../utils';

module.exports = function() {
    let self = this;

    let android = Binder.objPropDelegates('pushNotificationARNs', 'Android');
    let ios = Binder.objPropDelegates('pushNotificationARNs', 'iPhone OS');

    let binder = new Binder(self)
        .bind('accountLimit', 0, null, parseInt)
        .bind('androidArn', null, android.fromObject, android.toObject)
        .bind('emailSignInEnabled')
        .bind('phoneSignInEnabled')
        .bind('emailVerificationEnabled')
        .bind('reauthenticationEnabled')
        .bind('externalIdRequiredOnSignup')
        .bind('externalIdValidationEnabled')
        .bind('healthCodeExportEnabled')
        .bind('iosArn', null, ios.fromObject, ios.toObject)
        .bind('strictUploadValidationEnabled')
        .bind('studyIdExcludedInExport');

    self.accountLimitLabel = ko.computed(function(){
        return (self.accountLimitObs() == "0") ? "None" : self.accountLimitObs();
    });

    self.save = function(vm, event) {
        self.study = binder.persist(self.study);

        let enabled = Object.keys(self.study.pushNotificationARNs).length > 0;
        root.notificationsEnabledObs(enabled);

        utils.startHandler(self, event);
        serverService.saveStudy(self.study, true)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler());
    };

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .catch(utils.failureHandler());
};
module.exports.prototype.dispose = function() {
    this.accountLimitLabel.dispose();
};