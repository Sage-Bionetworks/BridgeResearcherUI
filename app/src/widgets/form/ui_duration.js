import ko from "knockout";
import utils from "../../utils";

const FIELDS = {
  'minutes': { value: "PT*M", label: "Minutes" },
  'hours':  { value: "PT*H", label: "Hours" },
  'days': { value: "P*D", label: "Days" },
  'weeks': { value: "P*W", label: "Weeks" },
  'months': { value: "P*M", label: "Months" },
  'years': { value: "P*Y", label: "Years" }
}

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

  let fieldNames = params.fields.split(' ');

  self.durationOptions = [];
  fieldNames.forEach(field => self.durationOptions.push(FIELDS[field]));
  self.durationOptionsLabel = utils.makeOptionLabelFinder(self.durationOptions);

  function updateSubFields() {
    let value = self.fieldObs();
    if (value) {
      let amt = parseInt(value.replace(/\D/g, ""), 10);
      let duration = value.split(/\d+/).join("*");
      if (amt === 0) {
        self.amountObs(null);
        self.durationObs(null);
        return;
      }
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
    // if (!isNaN(amt)) {
    if (typeof amt === "number" && amt % 1 === 0 && self.durationOptionsLabel(duration) !== "" && amt > -1) {
      self.fieldObs(duration.replace("*", amt));
    }
  }
};
uiDuration.prototype.dispose = function() {
  this.computedUpdateSubFields.dispose();
};
