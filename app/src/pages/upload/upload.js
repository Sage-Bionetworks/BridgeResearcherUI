import { serverService } from "../../services/server_service";
import utils from "../../utils";
import Binder from "../../binder";

module.exports = function(params) {
  var self = this;

  var binder = new Binder(self).obs("title", params.guid).obs("uploadDetails");

  serverService
    .getUploadById(params.guid)
    .then(response => {
      self.uploadDetailsObs(response);
    })
    .catch(utils.failureHandler());
};
