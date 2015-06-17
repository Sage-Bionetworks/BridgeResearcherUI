var ko = require('knockout');
var serverService = require('../../services/server_service');

module.exports = function() {
    var self = this;

    self.tab = ko.observable('current');
    self.tab.subscribe(function(value) {
        if (value === "history") {
            serverService.getConsentHistory().then(function(data) {
                self.historyItems(data.items);
            });
        }
    });
    self.active = ko.observable(true);
    self.date = ko.observable('...');
    self.historyItems = ko.observableArray();
    self.editor = null;

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getStudy().then(function(study) {
            self.study = study;
            self.subject(study.verifyEmailTemplate.subject);
            self.editor.setData(study.verifyEmailTemplate.body);
        });
    };

    self.formatDate = function(date) {
        return new Date(date).toLocaleString();
    };

    function loadIntoEditor(consent) {
        self.date("Created on " + self.formatDate(consent.createdOn));
        self.active(consent.active);
        self.tab('current');
    }

    serverService.getActiveStudyConsent().then(loadIntoEditor);

    self.save = function() {
        console.log(self.editor.getData());
    };

    self.loadHistoryItem = function(item) {
        serverService.getStudyConsent(item.createdOn).then(loadIntoEditor);
    };
};
