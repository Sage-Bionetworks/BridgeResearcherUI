import Binder from "../../binder";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

function appleModelToObs(array, context) {
  return (array || []).map(function(obj) {
    return {
      appIdObs: ko.observable(obj.appID),
      pathsObs: ko.observableArray(obj.paths)
    };
  });
}
function appleObsToModel(array) {
  return array.map(function(obj) {
    return {
      appID: obj.appIdObs(),
      paths: obj.pathsObs()
    };
  });
}
function androidModelToObs(array, context) {
  return (array || []).map(function(obj) {
    return {
      namespaceObs: ko.observable(obj.namespace),
      packageNameObs: ko.observable(obj.package_name),
      fingerprintsObs: ko.observableArray(obj.sha256_cert_fingerprints)
    };
  });
}
function androidObsToModel(array) {
  return array.map(function(obj) {
    return {
      namespace: obj.namespaceObs(),
      package_name: obj.packageNameObs(),
      sha256_cert_fingerprints: obj.fingerprintsObs()
    };
  });
}

export default function() {
  let self = this;

  let binder = new Binder(this)
    .bind("appleAppLinks[]", [], appleModelToObs, appleObsToModel)
    .bind("androidAppLinks[]", [], androidModelToObs, androidObsToModel)
    .obs("appleIndex")
    .obs("androidIndex")
    .obs("identifier");

  self.save = function(vm, event) {
    self.app = binder.persist(self.app);

    utils.startHandler(vm, event);
    serverService.saveApp(self.app)
      .then(utils.successHandler(vm, event, "App information saved."))
      .catch(utils.failureHandler({ id: 'applinks' }));
  };
  self.removeAppleAppLink = function(element, event) {
    self.appleAppLinksObs.remove(element);
  };
  self.openAppleAppLinkEditor = function(element, event) {
    root.openDialog("edit_apple_link", {
      app: self.app,
      appleAppLinksObs: self.appleAppLinksObs
    });
  };
  self.pathFormatter = function(appleLink) {
    return appleLink.pathsObs().join(", ");
  };
  self.removeAndroidAppLink = function(element, event) {
    self.androidAppLinksObs.remove(element);
  };
  self.openAndroidAppLinkEditor = function(element, event) {
    root.openDialog("edit_android_link", {
      app: self.app,
      androidAppLinksObs: self.androidAppLinksObs
    });
  };
  self.fingerprintsFormatter = function(androidLink) {
    return androidLink
      .fingerprintsObs()
      .map(function(fp) {
        return '<span title="' + fp + '">' + fp.substring(0, 8) + "&hellip;</span>";
      })
      .join(", ");
  };

  serverService.getApp()
    .then(binder.assign("app"))
    .then(binder.update())
    .catch(utils.failureHandler({ id: 'applinks' }));
};
