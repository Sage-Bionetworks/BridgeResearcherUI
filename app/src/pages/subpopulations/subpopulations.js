import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function subpopulations() {
  let self = this;

  fn.copyProps(self, root, "isDeveloper", "isAdmin");
  self.criteriaLabel = criteriaUtils.label;

  tables.prepareTable(self, {
    name: "consent group",
    type: "Subpopulation",
    refresh: load,
    delete: (plan) => serverService.deleteSubpopulation(plan.guid, false),
    deletePermanently: (plan) => serverService.deleteSubpopulation(plan.guid, true),
    undelete: (plan) => serverService.updateSubpopulation(plan)
  });

  function getSubpopulations() {
    return serverService.getAllSubpopulations(self.showDeletedObs());
  }

  function load() {
    getSubpopulations()
      .then(fn.handleSort("items", "name"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler());
  }
  load();
};
