import Binder from "../../binder";
import serverService from "../../services/server_service";
import storeService from "../../services/store_service";
import UploadsViewModel from "../uploads/uploads";
import utils from "../../utils";

const PAGE_KEY = "us";

const failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found",
  id: 'participant-uploads'
});

export default class ParticipantUploadsViewModel extends UploadsViewModel {
  constructor(params) {
    super(params, PAGE_KEY);
    new Binder(this)
      .obs("userId", params.userId)
      .obs("name", "")
      .obs("status")
      .obs("title", "&#160;")
      .obs("sharingScope");
  }
  loadingFunc(args) {
    this.updateDateRange();
    this.query.offsetKey = args.offsetKey
    this.query.pageSize = 10;
    storeService.persistQuery(PAGE_KEY, this.query);

    return serverService.getParticipantName(this.userIdObs()).then(part => {
      this.titleObs(part.name);
      this.nameObs(part.name);
      this.statusObs(part.status);
      this.sharingScopeObs(part.sharingScope);
    }).then(() => serverService.getParticipantUploads(this.userIdObs(), this.query))
      .then(this.processUploads.bind(this))
      .catch(utils.failureHandler({ id: 'participant-uploads' }));
  }
};
