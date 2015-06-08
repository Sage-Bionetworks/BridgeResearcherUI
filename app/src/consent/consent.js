var ko = require('knockout');
var serverService = require('../services/server_service');
var $ = require('jquery');

ko.bindingHandlers.createEditor = {
    init: function(element) {
        CKEDITOR.replace(element);
    }
}
function formatDate(string) {
    return new Date(string).toLocaleString();
}
/**
 * Consent active states are not marked correctly. Fix this, and also format
 * the date.
 * @param observableArray
 * @param consent
 * @returns {*}
 */
function fixConsent(observableArray, consent) {
    if (observableArray.length) {
        var modified = observableArray.filter(function(item) {
            return (new Date(item.createdOn).getTime() === consent.createdOn);
        })[0];
        consent.active = modified.active;
    }
    consent.createdOnDisplay = formatDate(consent.createdOn);
    return consent;
}
/**
 * If there's history, find this consent and change its active value to reflect reality.
 * Another oddity of the API is that the consent comes back with a long, not a timestamp
 * string. This is also normalized by the formatDate() function.
 * @param consents
 * @returns {*}
 */
function fixConsents(consents) {
    var marked = false;
    consents.forEach(function(consent) {
        if (consent.active) {
            consent.active = !marked;
            marked = true;
        }
        consent.createdOnDisplay = formatDate(consent.createdOn);
    })
    return consents;
}

module.exports = function() {
    var self = this;

    self.tab = ko.observable('current');
    self.tab.subscribe(function(value) {
        if (value === "history") {
            serverService.getConsentHistory().then(function(data) {
                self.historyItems(fixConsents(data.items));
            });
        }
    });
    self.active = ko.observable(true);
    self.date = ko.observable('...');
    self.historyItems = ko.observableArray();

    function loadIntoEditor(consent) {
        consent = fixConsent(self.historyItems(), consent);
        self.date("Created on " + consent.createdOnDisplay);
        self.active(consent.active);
        self.tab('current');
    }

    serverService.getActiveStudyConsent().then(loadIntoEditor);

    self.save = function() {
        console.log(CKEDITOR.instances.currentConsentEditor.getData());
    };

    self.loadHistoryItem = function(item) {
        serverService.getStudyConsent(item.createdOn).then(loadIntoEditor);
    };
};
