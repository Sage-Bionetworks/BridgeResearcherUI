import Binder from "../../../binder";
import ko from "knockout";
import root from "../../../root";
import serverService from "../../../services/server_service";
import utils from "../../../utils";

export default function info() {
  let self = this;

  let android = Binder.objPropDelegates("pushNotificationARNs", "Android");
  let ios = Binder.objPropDelegates("pushNotificationARNs", "iPhone OS");

  let binder = new Binder(self)
    .bind("accountLimit", 0, null, parseInt)
    .bind("androidArn", null, android.fromObject, android.toObject)
    .bind("emailSignInEnabled")
    .bind("phoneSignInEnabled")
    .bind("emailVerificationEnabled")
    .bind("reauthenticationEnabled")
    .bind("externalIdRequiredOnSignup")
    .bind("healthCodeExportEnabled")
    .bind("usesCustomExportSchedule")
    .bind("verifyChannelOnSignInEnabled")
    .bind("iosArn", null, ios.fromObject, ios.toObject)
    .bind("strictUploadValidationEnabled")
    .bind("appIdExcludedInExport");

  self.accountLimitLabel = ko.computed(function() {
    return self.accountLimitObs() == "0" ? "None" : self.accountLimitObs();
  });

  self.save = function(vm, event) {
    self.app = binder.persist(self.app);

    let enabled = Object.keys(self.app.pushNotificationARNs).length > 0;
    root.notificationsEnabledObs(enabled);

    utils.startHandler(self, event);
    serverService
      .saveApp(self.app)
      .then(utils.successHandler(vm, event, "App information saved."))
      .catch(utils.failureHandler({id: 'info'}));
  };

  serverService
    .getApp()
    .then(binder.assign("app"))
    .then(binder.update())
    .catch(utils.failureHandler({id: 'info'}));
};
info.prototype.dispose = function() {
  this.accountLimitLabel.dispose();
};
