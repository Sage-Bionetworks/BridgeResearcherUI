var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

module.exports = function() {
    var self = this;

    self.message = ko.observable("This is a message");
    self.active = ko.observable(true);
    self.createdOn = ko.observable('Created on ...');
    self.historyItems = ko.observableArray();
    self.consentSelected = ko.observable(null);
    self.editor = null;

    self.tab = ko.observable('current');
    self.tab.subscribe(function(value) {
        self.message("");
        if (value === "history") {
            serverService.getConsentHistory().then(function(data) {
                self.historyItems(data.items);
            });
        }
    });

    function loadIntoEditor(consent) {
        if (consent.documentContent.indexOf("<html") > -1) {
            console.warn("HTML document returned from server, stripping out body content");
            var doc = consent.documentContent;
            consent.documentContent = doc.split(/<body[^>]*\>/)[1].split(/<\/body\>.*/)[0].trim();
            console.log("Content to edit", consent.documentContent);
        }
        self.createdOn("Created on " + self.formatDate(consent.createdOn));
        self.active(consent.active);
        self.editor.setData(consent.documentContent);
    }

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getMostRecentStudyConsent().then(loadIntoEditor);
    };

    self.formatDate = function(date) {
        return new Date(date).toLocaleString();
    };

    self.selectToPublish = function(vm, event) {
        self.consentSelected(ko.dataFor(event.target));
        return true;
    };

    self.publish = function(vm, event) {
        utils.startHandler(vm, event);
        serverService.publishStudyConsent(self.consentSelected().createdOn)
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                serverService.getConsentHistory().then(function(data) {
                    self.historyItems(data.items);
                });
                self.loadHistoryItem(self.consentSelected());
                self.consentSelected(null);
            })
            .catch(utils.failureHandler(vm ,event));
    };

    self.save = function(passwordPolicy, event) {
        utils.startHandler(self, event);

        serverService.saveStudyConsent({documentContent: self.editor.getData()})
            .then(utils.successHandler(self, event))
            .then(loadIntoEditor)
            .then(function() {
                self.message({text:"Consent saved."});
            })
            .catch(utils.failureHandler(self, event));
    };

    self.loadHistoryItem = function(item) {
        serverService.getStudyConsent(item.createdOn)
            .then(loadIntoEditor)
            .then(function() {
                self.tab('current');
            });
    };
};
