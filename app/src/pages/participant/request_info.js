var serverService = require('../../services/server_service');
var bind = require('../../binder');
var root = require('../../root');
var utils = require('../../utils');

function joiner(value) {
    return (value && value.length) ? value.join(", ") : "<none>";
}
function stringer(value) {
    var array = [];
    if (value) {
        delete value.type;
        for (var prop in value) {
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
    var self = this;

    var binder = bind(self)
        .obs('isNew', false)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('title', '&#160;')
        .obs('status')
        .obs('languages', null, joiner)
        .obs('userDataGroups', null, joiner)
        .obs('signedInOn', null, dater)
        .obs('clientInfo', null, stringer)
        .obs('activitiesAccessedOn', null, dater)
        .obs('timeZone', null, noner)
        .obs('userAgent', null, noner);

    self.isPublicObs = root.isPublicObs;

    function requestInfo() {
        return serverService.getParticipantRequestInfo(params.userId);
    }

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.nameObs(root.isPublicObs() ? part.name : part.externalId);
        self.statusObs(part.status);
    }).then(requestInfo)
        .then(binder.update())
        .catch(utils.failureHandler());
};