import ko from "knockout";
import utils from "../../utils";

const DURATION_OPTIONS = Object.freeze([
  { value: "PT*H", label: "Hours" },
  { value: "P*D", label: "Days" },
  { value: "P*W", label: "Weeks" },
  { value: "P*M", label: "Months" }
]);
const DURATION_NO_HOURS_OPTIONS = Object.freeze([
  { value: "P*D", label: "Days" },
  { value: "P*W", label: "Weeks" },
  { value: "P*M", label: "Months" }
]);

/**
 * Let's call the numerical portion of the duration the 'amount', and kind of time
 * period being described the 'duration'.
 *
 * @param params
 *  fieldObs - the field this control represents
 *  noHours - if true, no hours will be shown in the dropdown menu
 */
export default function uiDuration(params) {
  let self = this;

  self.fieldObs = params.fieldObs;
  self.amountObs = ko.observable();
  self.durationObs = ko.observable();

  if (params.noHours === true) {
    self.durationOptions = DURATION_NO_HOURS_OPTIONS;
    self.durationOptionsLabel = utils.makeOptionLabelFinder(DURATION_NO_HOURS_OPTIONS);
  } else {
    self.durationOptions = DURATION_OPTIONS;
    self.durationOptionsLabel = utils.makeOptionLabelFinder(DURATION_OPTIONS);
  }

  function updateSubFields() {
    let value = self.fieldObs();
    if (value) {
      let amt = parseInt(value.replace(/\D/g, ""), 10);
      let duration = value.split(/\d+/).join("*");
      if (amt === parseInt(amt, 10) && self.durationOptionsLabel(duration) !== "") {
        self.amountObs(amt);
        self.durationObs(duration);
      }
    }
  }
  self.computedUpdateSubFields = ko.computed(updateSubFields);
  self.amountObs.subscribe(updateFieldObs);
  self.durationObs.subscribe(updateFieldObs);

  function updateFieldObs() {
    let amt = self.amountObs();
    let duration = self.durationObs();

    self.fieldObs(null);

    amt = parseInt(amt, 10);
    if (typeof amt === "number" && amt % 1 === 0 && self.durationOptionsLabel(duration) !== "" && amt > 0) {
      self.fieldObs(duration.replace("*", amt));
    }
  }
};
uiDuration.prototype.dispose = function() {
  this.computedUpdateSubFields.dispose();
};
