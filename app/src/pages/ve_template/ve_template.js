var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function() {
    var self = this;

    self.study = null;
    self.subject = ko.observable("");
    self.message = ko.observable("");
    self.errorFields = ko.observableArray();
    self.editor = null;

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getStudy().then(function(study) {
            self.study = study;
            self.subject(study.verifyEmailTemplate.subject);
            self.editor.setData(study.verifyEmailTemplate.body);
        });
    };

    self.errorFor = function(fieldName) {
        return ko.computed(function() {
            return (self.errorFields.indexOf(fieldName) > -1) ? "error" : "";
        });
    };

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study.verifyEmailTemplate.subject = self.subject();
        self.study.verifyEmailTemplate.body = self.editor.getData();

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                self.message({text:"Email saved."});
                self.study.version = response.version;
            }).catch(utils.failureHandler(vm, event));
    };
};