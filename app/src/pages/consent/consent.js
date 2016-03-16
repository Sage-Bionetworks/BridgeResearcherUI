var ko = require('knockout');
var utils = require('../../utils');
var config = require('../../config');
var serverService = require('../../services/server_service');

var fields = ['message', 'active', 'createdOn', 'historyItems[]'];

module.exports = function(params) {
    var self = this;

    // subpopulation fields
    self.guidObs = ko.observable(params.guid);
    self.nameObs = ko.observable();
    serverService.getSubpopulation(params.guid).then(function(subpop) {
        self.nameObs(subpop.name);
    });

    utils.observablesFor(self, fields);
    self.activeObs = ko.observable(true);
    self.htmlUrlObs = ko.observable('');
    self.pdfUrlObs = ko.observable('');
    self.editor = null;

    self.tabObs = ko.observable('current');
    self.tabObs.subscribe(function(value) {
        if (value === "history") {
            serverService.getConsentHistory(params.guid).then(function(data) {
                self.historyItemsObs(data.items);
            });
        }
    });

    // The editor and the request for the content can arrive in any order. bind here
    self.initEditor = (function(vm) {
        var documentContent = null;
        return function(object) {
            if (typeof object === "string") { // content
                documentContent = object;
            } else { // editor
                vm.editor = object;
            }
            if (vm.editor && documentContent) {
                vm.editor.setData(documentContent);
                documentContent = null;
            }
        };
    })(self);

    function loadIntoEditor(consent) {
        if (consent.documentContent.indexOf("<html") > -1) {
            var doc = consent.documentContent;
            consent.documentContent = doc.split(/<body[^>]*\>/)[1].split(/<\/body\>.*/)[0].trim();
        }
        self.createdOnObs(self.formatDateTime(consent.createdOn));
        self.activeObs(consent.active);
        self.consent = consent;
        // This could be "recent" but we don't want that after we get a real version
        params.createdOn = consent.createdOn;
        self.initEditor(consent.documentContent);
    }
    function publish(response) {
        params.createdOn = response.createdOn;
        return serverService.publishStudyConsent(params.guid, params.createdOn);
    }
    function load() {
        return serverService.getStudyConsent(params.guid, params.createdOn);
    }
    function saveAfterPublish(response) {
        /*
        self.activeObs(true);
        self.createdOnObs(self.formatDateTime(params.createdOn));
        */
        serverService.getConsentHistory(params.guid).then(function(data) {
            self.historyItemsObs(data.items);
        }).catch(utils.errorHandler);
        return response;
    }

    self.formatDateTime = utils.formatDateTime;

    self.publish = function(vm, event) {
        if (confirm("Are you sure you want to publish this consent?")) {
            utils.startHandler(vm, event);

            params.guid = vm.subpopulationGuid;
            params.createdOn = vm.createdOn;

            serverService.publishStudyConsent(params.guid, params.createdOn)
                .then(load)
                .then(loadIntoEditor)
                .then(saveAfterPublish)
                .then(utils.successHandler(vm, event, "Consent published"))
                .catch(utils.failureHandler(vm, event));
        }
    };
    self.save = function(passwordPolicy, event) {
        utils.startHandler(self, event);

        serverService.saveStudyConsent(params.guid, {documentContent: self.editor.getData()})
            .then(loadIntoEditor)
            .then(utils.successHandler(self, event, "Consent saved."))
            .catch(utils.failureHandler(self, event));
    };
    self.loadHistoryItem = function(item) {
        serverService.getStudyConsent(params.guid, item.createdOn)
            .then(loadIntoEditor)
            .then(function() {
                self.tabObs('current');
            }).catch(utils.errorHandler);
    };
    if (params.createdOn) {
        serverService.getStudyConsent(params.guid, params.createdOn)
                .then(loadIntoEditor)
                .then(function() {self.tabObs('current');})
                .catch(utils.errorHandler);
    } else {
        serverService.getMostRecentStudyConsent(params.guid)
                .then(loadIntoEditor)
                .then(function() {self.tabObs('current');})
                .catch(utils.errorHandler);
    }
    serverService.getSession().then(function(session) {
        var host = config.host[session.environment] + "/" + params.guid + "/consent.";
        host = host.replace('https','http');
        host = host.replace('webservices','docs');
        self.htmlUrlObs(host + 'html');
        self.pdfUrlObs(host + 'pdf');
    });
};
