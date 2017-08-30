import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import serverService from '../../services/server_service';
import jsonFormatter from '../../json_formatter';
import utils from '../../utils';
import alerts from '../../widgets/alerts';

var failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    var self = this;
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
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
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
            alerts.error("That does not appear to be valid JSON.");
            return false;
        }
        return true;
    }

    self.save = function(vm, event) {
        if (!updateClientData()) {
            return;
        }
        utils.startHandler(vm, event);
        serverService.updateParticipant(self.participant)
            .then(utils.successHandler(vm, event, "Client data updated."))
            .catch(utils.failureHandler());
    };
    self.reformat = updateClientData;
    
    self.isPublicObs = root.isPublicObs;        
};