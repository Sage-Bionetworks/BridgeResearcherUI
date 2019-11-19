import fn from "../../../functions";
import surveyUtils from "../survey_utils";

export default function(params) {
  let self = this;
  surveyUtils.initConstraintsVM(self, params);
  fn.copyProps(self, self.element.constraints, "earliestValueObs", "latestValueObs", 
    "allowFutureObs", "allowPastObs", "requiredObs");
};
