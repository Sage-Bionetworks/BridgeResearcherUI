var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

var fields = ['message', 'active', 'createdOn', 'historyItems[]', 'consentSelected'];

module.exports = function() {
    var self = this;

    utils.observablesFor(self, fields);
    self.activeObs = ko.observable(true);
    self.consentSelectedObs = ko.observable(null);
    self.editor = null;

    self.tabObs = ko.observable('current');
    self.tabObs.subscribe(function(value) {
        self.messageObs("");
        if (value === "history") {
            serverService.getConsentHistory().then(function(data) {
                self.historyItemsObs(data.items);
            });
        }
    });

    function loadIntoEditor(consent) {
        if (consent.documentContent.indexOf("<html") > -1) {
            var doc = consent.documentContent;
            consent.documentContent = doc.split(/<body[^>]*\>/)[1].split(/<\/body\>.*/)[0].trim();
        }
        self.createdOnObs(self.formatDateTime(consent.createdOn));
        self.activeObs(consent.active);
        self.editor.setData(consent.documentContent);
    }

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getMostRecentStudyConsent().then(loadIntoEditor);
    };

    self.formatDateTime = utils.formatDateTime;

    self.selectToPublish = function(vm, event) {
        self.consentSelectedObs(ko.dataFor(event.target));
        return true;
    };

    self.publish = function(vm, event) {
        utils.startHandler(vm, event);

        var createdOn = self.consentSelectedObs().createdOn;
        self.consentSelectedObs(null);

        serverService.publishStudyConsent(createdOn)
            .then(function(response) {
                serverService.getConsentHistory().then(function(data) {
                    self.historyItemsObs(data.items);
                    serverService.getStudyConsent(createdOn)
                        .then(loadIntoEditor);
                });
            })
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler(vm ,event));
    };

    self.save = function(passwordPolicy, event) {
        utils.startHandler(self, event);

        serverService.saveStudyConsent({documentContent: self.editor.getData()})
            .then(loadIntoEditor)
            .then(utils.successHandler(self, event, "Consent saved."))
            .catch(utils.failureHandler(self, event));
    };

    self.loadHistoryItem = function(item) {
        serverService.getStudyConsent(item.createdOn)
            .then(loadIntoEditor)
            .then(function() {
                self.tabObs('current');
            });
    };
};
