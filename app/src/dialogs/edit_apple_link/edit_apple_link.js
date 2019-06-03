import root from "../../root";
import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import ko from "knockout";
import utils from "../../utils";

export default function(params) {
  let self = this;
  self.link = {};
  self.studyPrefix = "/" + params.study.identifier + "/";
  self.closeDialog = root.closeDialog;

  let binder = new Binder(self)
    .bind("addField")
    .bind("appId")
    .bind("paths[]", [self.studyPrefix, self.studyPrefix + "*"]);

  self.add = function() {
    let value = self.addFieldObs();
    if (value && value.indexOf(self.studyPrefix) === -1) {
      value = self.studyPrefix + value;
      value = value.replace("//", "/");
      self.pathsObs.push(value);
      self.addFieldObs("");
    }
  };
  self.remove = function(path) {
    self.pathsObs.remove(path);
  };
  self.keyHandler = function(view, e) {
    if (e.keyCode === 13) {
      self.add();
      return false;
    }
    return true;
  };

  self.save = function() {
    let error = new BridgeError();
    if (!self.appIdObs()) {
      error.addError("appId", "is required");
    }
    if (self.pathsObs().length === 0) {
      error.addError("paths", "are required");
    }
    if (error.hasErrors()) {
      return utils.failureHandler({ transient: false })(error);
    }
    // We want to add this with all the observers and everything
    params.appleAppLinksObs.push({
      appIdObs: ko.observable(self.appIdObs()),
      pathsObs: ko.observableArray(self.pathsObs())
    });
    root.closeDialog();
  };
};
