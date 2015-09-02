var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.study = null;
    self.subject = ko.observable("");
    self.messageObs = ko.observable("");
    self.editor = null;

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getStudy().then(function(study) {
            self.study = study;
            self.subject(study.verifyEmailTemplate.subject);
            self.editor.setData(study.verifyEmailTemplate.body);
        });
    };

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study.verifyEmailTemplate.subject = self.subject();
        self.study.verifyEmailTemplate.body = self.editor.getData();

        serverService.saveStudy(self.study)
            .then(function(response) {
                self.study.version = response.version;
            })
            .then(utils.successHandler(vm, event, "Email saved."))
            .catch(utils.failureHandler(vm, event));
    };
};