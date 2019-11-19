import fn from "../../../functions";
import ko from "knockout";
import surveyUtils from "../survey_utils";

function valueToObservers(self, prefix) {
  let yearObs = `${prefix}ValueYearObs`;
  let targetObs = `${prefix}ValueObs`;
  let value = self[targetObs]();

  self[yearObs] = ko.observable();
  if (value) {
    self[yearObs](value);
  }
  self[yearObs].subscribe(v => self[targetObs](self[yearObs]()));
}

export default function(params) {
  let self = this;
  surveyUtils.initConstraintsVM(self, params);
  fn.copyProps(self, self.element.constraints, "earliestValueObs", "latestValueObs", 
    "allowFutureObs", "allowPastObs", "requiredObs");

  valueToObservers(self, "earliest");
  valueToObservers(self, "latest");
};
