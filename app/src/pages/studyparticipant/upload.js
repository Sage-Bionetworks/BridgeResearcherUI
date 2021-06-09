import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function upload(params) {
  let self = this;

  fn.copyProps(self, root, "isResearcher");

  new Binder(self)
    .obs("title")
    .obs("name")
    .obs("status")
    .obs("userId", params.userId)
    .obs("studyId", params.studyId)
    .obs("subTitle", params.guid)
    .obs("uploadDetails")
    .bind("navStudyId", params.studyId)
    .bind("navStudyName");

  serverService.getStudy(params.studyId).then((response) => {
    self.navStudyNameObs(response.name);
  });
  serverService.getStudyParticipantName(params.studyId, params.userId).then(function(part) {
    self.titleObs(part.name);
    self.nameObs(part.name);
    self.statusObs(part.status);
  });
  serverService.getUploadById(params.guid)
    .then(response => self.uploadDetailsObs(response))
    .catch(utils.failureHandler({ id: 'studyparticipant-upload' }));
};
