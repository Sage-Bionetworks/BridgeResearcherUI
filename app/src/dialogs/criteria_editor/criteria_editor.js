import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;

  let binder = new Binder(self)
    .bind("language")
    .bind("allOfGroups[]")
    .bind("noneOfGroups[]")
    .bind("allOfSubstudyIds[]")
    .bind("noneOfSubstudyIds[]")
    .obs("iosMin")
    .obs("iosMax")
    .obs("androidMin")
    .obs("androidMax")
    .obs("dataGroupsOptions[]")
    .obs("substudyOptions[]");

  function updateObservers(crit) {
    if (crit) {
      crit.minAppVersions = crit.minAppVersions || {};
      crit.maxAppVersions = crit.maxAppVersions || {};
      binder.update()(crit);
      self.iosMinObs(crit.minAppVersions["iPhone OS"]);
      self.iosMaxObs(crit.maxAppVersions["iPhone OS"]);
      self.androidMinObs(crit.minAppVersions.Android);
      self.androidMaxObs(crit.maxAppVersions.Android);
    }
  }
  updateObservers(params.criteriaObs());

  self.closeDialog = root.closeDialog;
  self.update = function() {
    var crit = {
      minAppVersions: {
        "iPhone OS": intValue(self.iosMinObs()),
        Android: intValue(self.androidMinObs())
      },
      maxAppVersions: {
        "iPhone OS": intValue(self.iosMaxObs()),
        Android: intValue(self.androidMaxObs())
      },
      language: self.languageObs(),
      allOfGroups: self.allOfGroupsObs(),
      noneOfGroups: self.noneOfGroupsObs(),
      allOfSubstudyIds: self.allOfSubstudyIdsObs(),
      noneOfSubstudyIds: self.noneOfSubstudyIdsObs()
    };
    let error = new BridgeError();
    if (greaterThan(crit, 'iPhone OS')) {
      error.addError("minAppVersions_iphone_os", "cannot be greater than the maximum version");
    }
    if (greaterThan(crit, 'Android')) {
      error.addError("minAppVersions_android_os", "cannot be greater than the maximum version");
    }
    if (intersect(crit.allOfGroups, crit.noneOfGroups)) {
      error.addError("dataGroups", "cannot require and prohibit the same groups");
    }
    if (intersect(crit.allOfSubstudyIds, crit.noneOfSubstudyIds)) {
      error.addError("substudyIds", "cannot require and prohibit the same IDs");
    }
    if (error.hasErrors()) {
      return utils.failureHandler({ transient: false, id: 'criteria_editor' })(error);
    }
    params.criteriaObs(crit);
    root.closeDialog();
  };

  function greaterThan(crit, field) {
    let min = crit.minAppVersions[field] || 0;
    let max = crit.maxAppVersions[field] || Number.MAX_VALUE;
    return min > max;
  }
  function intersect(array1, array2) {
    return array1.filter(value => -1 !== array2.indexOf(value)).length > 0;
  }

  function intValue(value) {
    return fn.isNotBlank(value) ? parseInt(value, 10) : null;
  }

  serverService.getStudy().then(function(study) {
    self.dataGroupsOptionsObs(study.dataGroups);
  });
  serverService.getSubstudies().then(function(substudies) {
    self.substudyOptionsObs(substudies.items.map(sub => sub.id));
  });
};
