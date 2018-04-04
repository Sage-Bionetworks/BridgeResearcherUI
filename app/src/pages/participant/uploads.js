import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import utils from '../../utils';
import UploadsViewModel from '../uploads/uploads';

const PAGE_SIZE = 25;

const failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = class ParticipantUploadsViewModel extends UploadsViewModel {
    constructor(params) {
        super(params);
        new Binder(this)
            .obs('userId', params.userId)
            .obs('name', '')
            .obs('status')
            .obs('title', '&#160;');
        serverService.getParticipantName(params.userId).then((part) => {
            this.titleObs(part.name);
            this.nameObs(part.name);
            this.statusObs(part.status);
        }).catch(failureHandler);
                
    }
    loadingFunc(args) {
        args = args || {};
        args.pageSize = PAGE_SIZE;
        let {start, end} = this.dateRange();
        args.startTime = start;
        args.endTime = end;
        return serverService.getParticipantUploads(this.userIdObs(), args)
            .then(this.processUploads.bind(this))
            .catch(utils.failureHandler());
    }
};
