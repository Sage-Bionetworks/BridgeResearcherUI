import root from "../../root";
import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import ko from "knockout";
import utils from "../../utils";

export default function(params) {
  let self = this;
  self.link = {};
  self.closeDialog = root.closeDialog;

  let binder = new Binder(self)
    .bind("addField")
    .bind("namespace")
    .bind("packageName")
    .bind("fingerprints[]", []);

  self.add = function() {
    let value = self.addFieldObs();
    if (value) {
      self.fingerprintsObs.push(value);
      self.addFieldObs("");
    }
  };
  self.remove = function(path) {
    self.fingerprintsObs.remove(path);
  };
  self.keyHandler = function(view, e) {
    if (e.keyCode === 13) {
      self.add();
      return false;
    }
    return true;
  };

  function isValidFingerprint(fp) {
    return !/[0-9a-fA-F:]{95,95}/.test(fp);
  }
  self.save = function() {
    let error = new BridgeError();
    if (!self.namespaceObs()) {
      error.addError("namespace", "is required");
    }
    if (!self.packageNameObs()) {
      error.addError("packageName", "is required");
    }
    if (self.fingerprintsObs().length === 0) {
      error.addError("fingerprints", "are required");
    } else if (self.fingerprintsObs().some(isValidFingerprint)) {
      error.addError("fingerprints", "are not valid");
    }
    if (error.hasErrors()) {
      return utils.failureHandler({ transient: false })(error);
    }
    // We want to add this with all the observers and everything
    params.androidAppLinksObs.push({
      namespaceObs: ko.observable(self.namespaceObs()),
      packageNameObs: ko.observable(self.packageNameObs()),
      fingerprintsObs: ko.observableArray(self.fingerprintsObs())
    });
    root.closeDialog();
  };
};
// 14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5
