import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import storeService from "../../services/store_service";
import UploadsViewModel from "../uploads/uploads";
import utils from "../../utils";

const PAGE_KEY = "us";

export default class ParticipantUploadsViewModel extends UploadsViewModel {
  constructor(params) {
    super(params, PAGE_KEY);
    fn.copyProps(this, root, "isResearcher");
    new Binder(this)
      .obs("userId", params.userId)
      .obs("studyId", params.studyId)
      .obs("name", "")
      .obs("status")
      .obs("title", "&#160;")
      .obs("sharingScope")
      .bind("navStudyId", params.studyId)
      .bind("navStudyName")
      .obs("dataGroups", []);

    serverService.getStudyParticipant(params.studyId, params.userId).then((part) => {
      this.titleObs(part.name);
      this.statusObs(part.status);
      this.nameObs(part.name);
      this.sharingScopeObs(part.sharingScope);
      this.dataGroupsObs(part.dataGroups);
    });
    serverService.getStudy(params.studyId).then((response) => {
      this.navStudyNameObs(response.name);
    });
  }
  loadingFunc(args) {
    this.updateDateRange();
    this.query.offsetKey = args.offsetKey
    this.query.pageSize = 10;
    storeService.persistQuery(PAGE_KEY, this.query);

    return serverService.getStudyParticipantUploads(this.studyId, this.userIdObs(), this.query)
      .then(this.processUploads.bind(this))
      .catch(utils.failureHandler({ id: 'studyparticipant-uploads' }));
  }
};
