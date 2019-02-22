import ko from "knockout";
import { serverService } from "../../services/server_service";

module.exports = function() {
  let self = this;

  self.phoneSignInEnabledObs = ko.observable();

  serverService.getStudy().then(study => {
    self.phoneSignInEnabledObs(study.phoneSignInEnabled);
  });
};
