var serverService = require('../../services/server_service');
var utils = require('../../utils');
var config = require('../../config');
var bind = require('../../binder');

module.exports = function(params) {
    var self = this;
    self.editor = null;

    var binder = bind(self)
        .obs('mesage')
        .obs('active', true)
        .obs('createdOn')
        .obs('historyItems[]')
        .obs('guid', params.guid)
        .obs('name')
        .obs('htmlUrl')
        .obs('pdfUrl')
        .obs('tab', 'current');

    // subpopulation fields
    serverService.getSubpopulation(params.guid).then(function(subpop) {
        self.nameObs(subpop.name);
    });
    self.tabObs.subscribe(function(value) {
        if (value === "history") {
            serverService.getConsentHistory(params.guid)
                .then(updateHistoryItems);
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

    function updateHistoryItems(response) {
        self.historyItemsObs(response.items);
        return response;
    }
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
    function load() {
        return serverService.getStudyConsent(params.guid, params.createdOn);
    }
    function saveAfterPublish(response) {
        serverService.getConsentHistory(params.guid)
            .then(updateHistoryItems)
            .catch(utils.failureHandler());
        return response;
    }
    function showCurrentTab() {
        self.tabObs('current');
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
            .then(showCurrentTab)
            .catch(utils.failureHandler());
    };
    var promise = (params.createdOn) ?
        serverService.getStudyConsent(params.guid, params.createdOn) :
        serverService.getMostRecentStudyConsent(params.guid);
    promise.then(loadIntoEditor)
            .then(showCurrentTab)
            .catch(utils.failureHandler());
            
    serverService.getSession().then(function(session) {
        var host = config.host[session.environment] + "/" + params.guid + "/consent.";
        host = host.replace('https','http');
        host = host.replace('webservices','docs');
        self.htmlUrlObs(host + 'html');
        self.pdfUrlObs(host + 'pdf');
    });
};
