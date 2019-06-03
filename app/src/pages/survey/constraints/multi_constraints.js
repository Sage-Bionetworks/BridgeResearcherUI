import root from "../../../root";
import surveyUtils from "../survey_utils";

export default function(params) {
  let self = this;

  surveyUtils.initConstraintsVM(self, params);
  self.allowOtherObs = self.element.constraints.allowOtherObs;
  self.allowMultipleObs = self.element.constraints.allowMultipleObs;
  self.enumerationObs = self.element.constraints.enumerationObs;
  self.dataTypeObs = self.element.constraints.dataTypeObs;

  self.editEnum = function() {
    root.openDialog("enumeration_editor", { parentViewModel: self, enumerationObs: self.enumerationObs });
  };
};
