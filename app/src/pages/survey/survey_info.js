import surveyUtils from "./survey_utils";

export default function(params) {
  let self = this;
  self.collectionName = params.collectionName;
  surveyUtils.initConstraintsVM(self, params);
};
