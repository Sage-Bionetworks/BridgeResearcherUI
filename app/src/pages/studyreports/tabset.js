import ko from "knockout";
import config from "../../config";
import serverService from "../../services/server_service";

export default function studyReportTabset() {
  let self = this;

  self.isVisibleObs = ko.observable(false);
  serverService.getSession().then((session) => {
    self.isVisibleObs(config.retentionReports.includes(session.studyId));
  });
};
