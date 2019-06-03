import fn from "../../../functions";

export default function(params) {
  let self = this;

  fn.copyProps(
    self,
    params.viewModel,
    "labelObs",
    "scheduleCriteriaObs",
    "selectedElementObs",
    "selectCriteria",
    "removeCriteria",
    "addCriteria"
  );
};
