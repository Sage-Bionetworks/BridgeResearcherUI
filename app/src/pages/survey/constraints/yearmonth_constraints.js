import fn from "../../../functions";
import ko from "knockout";
import surveyUtils from "../survey_utils";

function valueToObservers(self, prefix) {
  let yearObs = `${prefix}ValueYearObs`;
  let monthObs = `${prefix}ValueMonthObs`;
  let targetObs = `${prefix}ValueObs`;
  let value = self[targetObs]();

  self[yearObs] = ko.observable();
  self[monthObs] = ko.observable();
  if (value) {
    self[yearObs](value.split("-")[0]);
    self[monthObs](value.split("-")[1]);
  }
  self[yearObs].subscribe(v => self[targetObs](fn.formatYearMonth(v, self[monthObs]())));
  self[monthObs].subscribe(v => self[targetObs](fn.formatYearMonth(self[yearObs](), v)));
}

module.exports = function(params) {
  let self = this;
  surveyUtils.initConstraintsVM(self, params);
  fn.copyProps(self, self.element.constraints, "earliestValueObs", "latestValueObs", "allowFutureObs");

  valueToObservers(self, "earliest");
  valueToObservers(self, "latest");
};
