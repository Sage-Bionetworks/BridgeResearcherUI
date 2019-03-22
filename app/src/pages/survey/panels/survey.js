import fn from "../../../functions";

const MAX_LENGTH = 65;

module.exports = function(params) {
  let self = this;

  fn.copyProps(self, params.viewModel, "nameObs", "elementsObs", "selectedElementObs", "selectElement");

  self.removeElement = function(data, event) {
    event.stopPropagation();
    params.viewModel.deleteElement(data, event);
  };

  self.truncate = function(value) {
    if (value && value.length > MAX_LENGTH) {
      return (
        value.split(" ").reduce(function(string, value) {
          if (string.length < MAX_LENGTH) {
            return string + " " + value;
          }
          return string;
        }, "") + "&hellip;"
      );
    }
    return value;
  };
};
