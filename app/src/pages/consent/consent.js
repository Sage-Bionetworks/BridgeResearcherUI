var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

module.exports = function() {
    var self = this;

    self.message = ko.observable();
    self.active = ko.observable(true);
    self.createdOn = ko.observable('Created on ...');
    self.historyItems = ko.observableArray();
    self.consentSelected = ko.observable(null);
    self.editor = null;

    self.tab = ko.observable('current');
    self.tab.subscribe(function(value) {
        if (value === "history") {
            serverService.getConsentHistory().then(function(data) {
                self.historyItems(data.items);
            });
        }
    });

    function loadIntoEditor(consent) {
        console.log("consent", consent);
        self.createdOn("Created on " + self.formatDate(consent.createdOn));
        self.active(consent.active);
        self.editor.setData(consent.documentContent);
        self.tab('current');
    }

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getActiveStudyConsent().then(loadIntoEditor);
    };

    self.formatDate = function(date) {
        return new Date(date).toLocaleString();
    };

    self.selectToPublish = function(vm, event) {
        self.consentSelected(ko.dataFor(event.target));
        return true;
    }

    self.publish = function(vm, event) {
        utils.startHandler(vm, event);
        serverService.publishStudyConsent(self.consentSelected().createdOn)
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                serverService.getConsentHistory().then(function(data) {
                    self.historyItems(data.items);
                });
            })
            .catch(utils.failureHandler(vm ,event));
    };

    self.save = function(passwordPolicy, event) {
        utils.startHandler(self, event);

        serverService.saveStudyConsent({documentContent: self.editor.getData()})
            .then(utils.successHandler(self, event))
            .then(loadIntoEditor)
            .catch(utils.failureHandler(self, event));
    };

    self.loadHistoryItem = function(item) {
        serverService.getStudyConsent(item.createdOn).then(loadIntoEditor);
    };
};
