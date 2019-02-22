import fn from "../../../functions";
import surveyUtils from "../survey_utils";

module.exports = function(params) {
  let self = this;
  surveyUtils.initConstraintsVM(self, params);
  fn.copyProps(
    self,
    self.element.constraints,
    "minLengthObs",
    "maxLengthObs",
    "patternObs",
    "patternPlaceholderObs",
    "patternErrorMessageObs"
  );
};
