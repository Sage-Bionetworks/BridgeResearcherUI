var ko = require('knockout');
var serverService = require('../../services/server_service');
var $ = require('jquery');

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
        console.log(CKEDITOR.instances.consentEditor.getData());
    };

    self.loadHistoryItem = function(item) {
        serverService.getStudyConsent(item.createdOn).then(loadIntoEditor);
    };
};
