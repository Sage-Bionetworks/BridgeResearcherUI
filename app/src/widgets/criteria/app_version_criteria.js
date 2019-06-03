import Binder from "../../binder";
import fn from "../../functions";

export default function(params) {
  let self = this;

  self.id = '';

  new Binder(self)
    .obs("iosMin")
    .obs("iosMax")
    .obs("androidMin")
    .obs("androidMax");

  self.iosMinObs.subscribe(update);
  self.iosMaxObs.subscribe(update);
  self.androidMinObs.subscribe(update);
  self.androidMaxObs.subscribe(update);

  function updateObservers(crit) {
    if (crit) {
      crit.minAppVersions = crit.minAppVersions || {};
      crit.maxAppVersions = crit.maxAppVersions || {};
      self.iosMinObs(crit.minAppVersions["iPhone OS"]);
      self.iosMaxObs(crit.maxAppVersions["iPhone OS"]);
      self.androidMinObs(crit.minAppVersions.Android);
      self.androidMaxObs(crit.maxAppVersions.Android);
    }
  }
  //updateObservers(params.criteriaObs());
  params.criteriaObs.subscribe(updateObservers);

  function update() {
    var crit = {
      minAppVersions: {
        "iPhone OS": intValue(self.iosMinObs()),
        Android: intValue(self.androidMinObs())
      },
      maxAppVersions: {
        "iPhone OS": intValue(self.iosMaxObs()),
        Android: intValue(self.androidMaxObs())
      }
    };
    params.criteriaObs(crit);
  }

  function intValue(value) {
    return fn.isNotBlank(value) ? parseInt(value, 10) : null;
  }
};
