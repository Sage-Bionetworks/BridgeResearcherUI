import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import root from "../../root";
import utils from "../../utils";

module.exports = function() {
  let self = this;

  let binder = new Binder(self).obs("minLengths", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]).bind("passwordPolicy");

  serverService
    .getStudy()
    .then(binder.assign("study"))
    .then(binder.update())
    .catch(utils.failureHandler());

  self.save = function(vm, event) {
    utils.startHandler(vm, event);
    self.study = binder.persist(self.study);

    serverService
      .saveStudy(self.study)
      .then(utils.successHandler(vm, event, "Password policy has been saved."))
      .catch(utils.failureHandler());
  };
};
