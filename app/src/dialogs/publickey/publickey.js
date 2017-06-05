var serverService = require('../../services/server_service');
var root = require('../../root');
var bind = require('../../binder');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('downloadHref', params.study.identifier + ".pem")
        .obs('downloadFileName', '')
        .obs('content');
    self.close = root.closeDialog;

    serverService.getStudyPublicKey().then(function(response) {
        var fileContents = 'data:text/plain;charset=utf-8,' + encodeURIComponent(response.publicKey);
        self.contentObs(response.publicKey);
        self.downloadFileNameObs(fileContents);
    });
};
