import Binder from "../../binder";
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

const failureHandler = utils.failureHandler({
  redirectMsg: "Consent group not found.",
  redirectTo: "subpopulations",
  transient: false,
  id: 'subpop-general'
});

function newSubpop() {
  return { name: "", description: "", criteria: criteriaUtils.newCriteria() };
}

export default function general(params) {
  let self = this;

  let binder = new Binder(self)
    .obs("isNew", params.guid === "new")
    .obs("guid", params.guid)
    .obs("title", "New Consent Group")
    .obs("allDataGroups[]")
    .obs("allSubstudyIds[]")    
    .bind("name")
    .bind("description")
    .bind("required", true)
    .bind("autoSendConsentSuppressed")
    .bind("dataGroupsAssignedWhileConsented[]")
    .bind("substudyIdsAssignedOnConsent[]")
    .bind("criteria");

  let titleUpdated = fn.handleObsUpdate(self.titleObs, "name");

  fn.copyProps(self, criteriaUtils, "label->criteriaLabel");
  self.openCriteriaDialog = function() {
    root.openDialog("criteria_editor", { criteriaObs: self.criteriaObs });
  };

  function saveSubpop() {
    return self.subpopulation.guid ? 
      serverService.updateSubpopulation(self.subpopulation) : 
      serverService.createSubpopulation(self.subpopulation);
  }

  self.save = function(vm, event) {
    self.subpopulation = binder.persist(self.subpopulation);
    utils.startHandler(vm, event);

    saveSubpop()
      .then(fn.handleStaticObsUpdate(self.isNewObs, false))
      .then(fn.handleObsUpdate(self.guidObs, "guid"))
      .then(fn.handleCopyProps(params, "guid"))
      .then(fn.returning(self.subpopulation))
      .then(titleUpdated)
      .then(utils.successHandler(vm, event, "Consent group has been saved."))
      .catch(failureHandler);
  };

  serverService
    .getStudy()
    .then(binder.assign("study"))
    .then((study) => self.allDataGroupsObs(study.dataGroups))
    .then(() => serverService.getSubstudies())
    .then((substudies) => self.allSubstudyIdsObs(substudies.items.map(sub => sub.id)))
    .then(() => {
      if (params.guid === "new") {
        return Promise.resolve(newSubpop())
          .then(binder.assign("subpopulation"))
          .then(binder.update());
      } else {
        return serverService
          .getSubpopulation(params.guid)
          .then(binder.assign("subpopulation"))
          .then(binder.update())
          .then(titleUpdated);
      }
    })
    .catch(failureHandler);
};
