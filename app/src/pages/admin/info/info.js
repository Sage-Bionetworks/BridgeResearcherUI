var serverService = require('../../../services/server_service');
var utils = require('../../../utils');
var bind = require('../../../binder');
var root = require('../../../root');
var ko = require('knockout');

module.exports = function() {
    var self = this;

    var ios = bind.objPropDelegates('pushNotificationARNs', 'iPhone OS');
    var android = bind.objPropDelegates('pushNotificationARNs', 'Android');

    var binder = bind(self)
        .bind('healthCodeExportEnabled')
        .bind('emailVerificationEnabled')
        .bind('externalIdValidationEnabled')
        .bind('emailSignInEnabled')
        .bind('externalIdRequiredOnSignup')
        .bind('strictUploadValidationEnabled')
        .bind('accountLimit', 0, null, parseInt)
        .bind('iosArn', null, ios.fromObject, ios.toObject)
        .bind('androidArn', null, android.fromObject, android.toObject);

    self.accountLimitLabel = ko.computed(function(){
        return (self.accountLimitObs() == "0") ? "None" : self.accountLimitObs();
    });

    self.save = function(vm, event) {
        self.study = binder.persist(self.study);

        var enabled = Object.keys(self.study.pushNotificationARNs).length > 0;
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