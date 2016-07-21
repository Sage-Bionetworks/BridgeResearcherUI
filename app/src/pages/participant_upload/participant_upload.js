var serverService = require('../../services/server_service');
var bind = require('../../binder');

// {userId, uploadId, name}}
module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('userId', params.userId)
        .obs('title', params.name)
        .obs('uploadId', params.uploadId)
        .obs('isNew', false);
    /* researchers can't access this right now.
    serverService.getParticipantUploadStatus(params.uploadId).then(function(response) {
        console.log(response);
    });*/
};