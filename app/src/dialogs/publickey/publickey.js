var ko = require('knockout');
var serverService = require('../../services/server_service');
var root = require('../../root');
var $ = require('jquery');

module.exports = function(params) {
    var self = this;

    self.contentObs = ko.observable();

    self.close = function(vm, event) {
        root.closeDialog();
    };
    self.downloadHref = ko.observable(params.study.identifier + ".pem");
    self.downloadFileName = ko.observable("");

    serverService.getStudyPublicKey().then(function(response) {
        self.contentObs(response.publicKey);
        self.downloadFileName('data:text/plain;charset=utf-8,' + encodeURIComponent(response.publicKey));
    });
};
