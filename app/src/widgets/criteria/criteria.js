import { serverService } from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';

/**
 * Params
 *  id - the id root to use for error message HTML ids
 *  criteriaObs - the criteria observer
 *  eventObj: an optional object on which to call a notifySubscribers event, if listening
 *      to criteriaObs directly is not enough to update external components.
 */
module.exports = function(params) {
  let self = this;

  fn.copyProps(self, params, 'id', 'criteriaObs');

  let binder = new Binder(self)
    .bind('language')
    .bind('allOfGroups[]')
    .bind('noneOfGroups[]')
    .obs('iosMin')
    .obs('iosMax')
    .obs('androidMin')
    .obs('androidMax')
    .obs('dataGroupsOptions[]');

  self.languageObs.subscribe(value =>
    self.criteriaObs().language = value);
  self.allOfGroupsObs.subscribe(value =>
    self.criteriaObs().allOfGroups = value);
  self.noneOfGroupsObs.subscribe(value =>
    self.criteriaObs().noneOfGroups = value);
  self.iosMinObs.subscribe(value =>
    self.criteriaObs().minAppVersions['iPhone OS'] = intValue(value));
  self.iosMaxObs.subscribe(value =>
    self.criteriaObs().maxAppVersions['iPhone OS'] = intValue(value));
  self.androidMinObs.subscribe(value =>
    self.criteriaObs().minAppVersions.Android = intValue(value));
  self.androidMaxObs.subscribe(value =>
    self.criteriaObs().maxAppVersions.Android = intValue(value));

  self.criteriaObs.subscribe(updateObservers);
  updateObservers(self.criteriaObs());

  function updateObservers(crit) {
    crit.minAppVersions = crit.minAppVersions || {};
    crit.maxAppVersions = crit.maxAppVersions || {};
    binder.update()(crit);
    self.iosMinObs(crit.minAppVersions['iPhone OS']);
    self.iosMaxObs(crit.maxAppVersions['iPhone OS']);
    self.androidMinObs(crit.minAppVersions.Android);
    self.androidMaxObs(crit.maxAppVersions.Android);
  }

  function intValue(value) {
    return (fn.isNotBlank(value)) ? parseInt(value, 10) : null;
  }

  serverService.getStudy().then(function (study) {
    self.dataGroupsOptionsObs(study.dataGroups);
  });
};
