import fn from "../../../functions";
import root from "../../../root";
import surveyUtils from "../survey_utils";

export default function(params) {
  let self = this;

  surveyUtils.initConstraintsVM(self, params);
  fn.copyProps(self, self.element.constraints, "allowOtherObs", "allowMultipleObs", "enumerationObs",
    "dataTypeObs", "requiredObs");
  self.editEnum = function() {
    root.openDialog("enumeration_editor", { parentViewModel: self, enumerationObs: self.enumerationObs });
  };
};
