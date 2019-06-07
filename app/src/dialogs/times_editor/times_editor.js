import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import scheduleFormatter from "../../schedule_formatter";

function hourMinuteValue(value) {
  return value.replace(":00.000", "");
}

export default function(params) {
  let self = this;

  self.itemsObs = ko.observableArray(ko.utils.arrayMap(params.timesObs(), hourMinuteValue));
  fn.copyProps(self, params, "timesObs", "clearTimesFunc");
  fn.copyProps(self, scheduleFormatter, "timeOptions->timesOptions", "timeOptionsLabel->timesLabel");
  self.scheduleType = params.scheduleTypeObs();
  self.timeObs = ko.observable();

  // When it's only one time, this becomes the control that reflects the
  // state of the schedule, so set the selected value in the select control
  if (self.scheduleType === "once") {
    self.timeObs(params.timesObs()[0]);
  }

  self.addTime = function(vm, event) {
    event.preventDefault();
    let time = scheduleFormatter.timeOptionsFinder(self.timeObs());
    if (self.itemsObs().indexOf(time.value) === -1) {
      self.itemsObs.push(time.value);
      self.itemsObs.sort();
    }
  };
  self.deleteTime = function(vm, event) {
    event.preventDefault();
    let context = ko.contextFor(event.target);
    self.itemsObs.remove(context.$data);
  };
  self.save = function() {
    // Get the time from different places depending on whether
    // it's a list or a single value.
    if (self.scheduleType === "once") {
      self.timesObs([self.timeObs()]);
    } else {
      self.timesObs(self.itemsObs());
    }
    root.closeDialog();
  };

  self.cancel = root.closeDialog;
  self.clear = function(vm, event) {
    self.clearTimesFunc(vm, event);
    root.closeDialog();
  };
};
