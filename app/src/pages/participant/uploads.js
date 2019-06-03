import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import storeService from "../../services/store_service";
import utils from "../../utils";
import UploadsViewModel from "../uploads/uploads";

const PAGE_SIZE = 25;
const PAGE_KEY = "us";

const failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found"
});

export default class ParticipantUploadsViewModel extends UploadsViewModel {
  constructor(params) {
    super(params);
    new Binder(this)
      .obs("userId", params.userId)
      .obs("name", "")
      .obs("status")
      .obs("title", "&#160;");
    serverService
      .getParticipantName(params.userId)
      .then(part => {
        this.titleObs(part.name);
        this.nameObs(part.name);
        this.statusObs(part.status);
      })
      .catch(failureHandler);
  }
  loadingFunc(args) {
    this.updateDateRange();
    this.updateDateRange();
    args.startTime = this.query.startTime;
    args.endTime = this.query.endTime;

    storeService.persistQuery(PAGE_KEY, args);

    return serverService
      .getParticipantUploads(this.userIdObs(), args)
      .then(this.processUploads.bind(this))
      .catch(utils.failureHandler());
  }
};
