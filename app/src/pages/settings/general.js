import Binder from "../../binder";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

function updateMinAppVersion(vm, obs, name) {
  let value = parseInt(obs(), 10);
  if (value >= 0) {
    vm.app.minSupportedAppVersions[name] = value;
  }
  obs(value);
}
function updateMinAppObservers(app, obs, name) {
  if (app.minSupportedAppVersions[name]) {
    obs(app.minSupportedAppVersions[name]);
  }
}
function zeroToMax(value) {
  return value === 0 ? 121 : value;
}
function maxToZero(value) {
  return (value === "121" || value === 121) ? 0 : parseInt(value);
}

export default function general() {
  let self = this;

  let binder = new Binder(self)
    .obs("message")
    .obs("identifier")
    .obs("minIos")
    .obs("minAndroid")
    .bind("name")
    .bind("shortName")
    .bind("sponsorName")
    .bind("minAgeOfConsent", null, zeroToMax, maxToZero);

  self.minAgeLabel = ko.computed(function() {
    return self.minAgeOfConsentObs() == "121" ? "No age limit" : self.minAgeOfConsentObs();
  });

  self.save = function(vm, event) {
    utils.startHandler(self, event);
    self.app = binder.persist(self.app);

    self.app.minSupportedAppVersions = {};
    updateMinAppVersion(self, self.minIosObs, "iPhone OS");
    updateMinAppVersion(self, self.minAndroidObs, "Android");

    serverService
      .saveApp(self.app, false)
      .then(utils.successHandler(vm, event, "App information saved."))
      .catch(utils.failureHandler({ id: 'general' }));
  };
  self.publicKey = function() {
    if (self.app) {
      root.openDialog("publickey", { app: self.app });
    }
  };

  function updateObservers(app) {
    updateMinAppObservers(app, self.minIosObs, "iPhone OS");
    updateMinAppObservers(app, self.minAndroidObs, "Android");
  }

  serverService
    .getApp()
    .then(binder.assign("app"))
    .then(binder.update())
    .then(updateObservers)
    .catch(utils.failureHandler({ id: 'general' }));
};
general.prototype.dispose = function() {
  this.minAgeLabel.dispose();
};
