var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.study = null;
    self.subject = ko.observable("");
    self.messageObs = ko.observable("");
    self.errorFields = ko.observableArray();
    self.editor = null;

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getStudy().then(function(study) {
            self.study = study;
            self.subject(study.resetPasswordTemplate.subject);
            self.editor.setData(study.resetPasswordTemplate.body);
        });
    };

    self.errorFor = function(fieldName) {
        return ko.computed(function() {
            return (self.errorFields.indexOf(fieldName) > -1) ? "error" : "";
        });
    };

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study.resetPasswordTemplate.subject = self.subject();
        self.study.resetPasswordTemplate.body = self.editor.getData();

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                self.messageObs({text:"Email saved."});
                self.study.version = response.version;
            }).catch(utils.failureHandler(vm, event));
    };
};