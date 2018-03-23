import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import root from '../../root';
import utils from '../../utils';

function joiner(value) {
    return (value && value.length) ? value.join(", ") : "<none>";
}
function stringer(value) {
    let array = [];
    if (value) {
        delete value.type;
        for (let prop in value) {
            array.push(prop + " = " + value[prop]);
        }
    }
    return array.join("<br>");
}
function dater(value) {
    return (value) ? new Date(value).toString() : "<none>";
}
function noner(value) {
    return (value) ? value : "<none>";
}

module.exports = function(params) {
    let self = this;

    let binder = new Binder(self)
        .obs('isNew', false)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('title', '&#160;')
        .obs('status')
        .obs('languages', null, joiner)
        .obs('userDataGroups', null, joiner)
        .obs('signedInOn', null, dater)
        .obs('clientInfo', null, stringer)
        .obs('uploadedOn', null, dater)
        .obs('activitiesAccessedOn', null, dater)
        .obs('timeZone', null, noner)
        .obs('userAgent', null, noner);

    function requestInfo() {
        return serverService.getParticipantRequestInfo(params.userId);
    }

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(part.name);
        self.nameObs(part.name);
        self.statusObs(part.status);
    }).then(requestInfo)
        .then(binder.update())
        .catch(utils.failureHandler());
};