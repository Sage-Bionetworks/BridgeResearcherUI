import {serverService} from '../../services/server_service';
import alerts from '../../widgets/alerts';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import fn from '../../functions';
import jsonFormatter from '../../json_formatter';
import root from '../../root';
import utils from '../../utils';

let failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    let self = this;
    self.participant = null;

    new Binder(self)
        .obs('userId', params.userId)
        .obs('isNew', false)
        .obs('title', '&#160;')
        .obs('guid', params.guid)
        .obs('startDate')
        .obs('endDate')
        .obs('status')
        .obs('clientData')
        .obs('warn', false);

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(part.name);
        self.statusObs(part.status);
    }).catch(failureHandler);

    serverService.getParticipant(params.userId).then(setClientData);

    function setClientData(response) {
        self.participant = response;
        if (response.clientData) {
            self.clientDataObs(jsonFormatter.prettyPrint(response.clientData));
        } else {
            self.clientDataObs("");
        }
    }
    function updateClientData() {
        try {
            if (self.clientDataObs()) {
                self.participant.clientData = JSON.parse(self.clientDataObs());
                self.clientDataObs(jsonFormatter.prettyPrint(self.participant.clientData));
            } else {
                delete self.participant.clientData;
            }
        } catch(e) {
            let error = new BridgeError();
            error.addError("clientData", "is not valid JSON");
            utils.failureHandler({transient:false})(error);
            return false;
        }
        return true;
    }

    self.save = function(vm, event) {
        utils.clearErrors();
        if (!updateClientData()) {
            return;
        }
        utils.startHandler(vm, event);
        serverService.updateParticipant(self.participant)
            .then(utils.successHandler(vm, event, "Client data updated."))
            .catch(utils.failureHandler());
    };
    self.reformat = function(vm,event) {
        utils.clearErrors();
        updateClientData();
    };
};