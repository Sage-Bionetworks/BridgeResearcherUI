import fn from "../../functions";

export default function(params) {
  let self = this;

  fn.copyProps(self, params, "valueObs", "verifiedObs");

  self.observerIcon = function() {
    if (self.valueObs() === null || self.valueObs() === "") {
      return "";
    }
    return self.verifiedObs() ? "green ui check icon" : "orange ui exclamation triangle icon";
  };
  self.observerText = function() {
    if (self.valueObs() === null || self.valueObs() === "") {
      return "";
    }
    return self.verifiedObs() ? "Verified" : "Unverified";
  };
};
