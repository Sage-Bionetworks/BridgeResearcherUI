import { serverService } from "../../services/server_service";
import utils from "../../utils";
import Binder from "../../binder";

export default function upload(params) {
  let self = this;

  let binder = new Binder(self)
    .obs("title")
    .obs("name")
    .obs("status")
    .obs("userId", params.userId)
    .obs("subTitle", params.guid)
    .obs("uploadDetails");

  serverService.getParticipantName(params.userId).then(function(part) {
    self.titleObs(part.name);
    self.nameObs(part.name);
    self.statusObs(part.status);
  });
  serverService
    .getUploadById(params.guid)
    .then(response => {
      self.uploadDetailsObs(response);
    })
    .catch(utils.failureHandler());
};
