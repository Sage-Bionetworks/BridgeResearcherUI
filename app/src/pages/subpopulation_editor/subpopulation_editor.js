var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');
var fn = require('../../transforms');

module.exports = function(params) {
    var self = this;
    self.editor = null;

    bind(self)
        .obs('active', true)
        .obs('createdOn')
        .obs('historyItems[]')
        .obs('guid', params.guid)
        .obs('name');

    // subpopulation fields
    serverService.getSubpopulation(params.guid).then(function(subpop) {
        self.nameObs(subpop.name);
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
    function load() {
        return serverService.getStudyConsent(params.guid, params.createdOn);
    }

    self.formatDateTime = fn.formatLocalDateTime;

    self.publish = function(vm, event) {
        if (confirm("Are you sure you want to save & publish this consent?")) {
            utils.startHandler(vm, event);
            
            utils.startHandler(vm, event);
            serverService.saveStudyConsent(params.guid, {documentContent: self.editor.getData()})
                .then(function(response) {
                    params.createdOn = response.createdOn;
                    self.createdOnObs(response.createdOn);
                    return serverService.publishStudyConsent(params.guid, params.createdOn);
                })
                .then(load)
                .then(loadIntoEditor)
                .then(utils.successHandler(vm, event, "Consent published"))
                .catch(utils.failureHandler(vm, event));
        }
    };
    self.save = function(vm, event) {
        utils.startHandler(self, event);

        serverService.saveStudyConsent(params.guid, {documentContent: self.editor.getData()})
            .then(loadIntoEditor)
            .then(utils.successHandler(vm, event, "Consent saved."))
            .catch(utils.failureHandler(vm, event));
    };
    var promise = (params.createdOn) ?
        serverService.getStudyConsent(params.guid, params.createdOn) :
        serverService.getMostRecentStudyConsent(params.guid);
    promise.then(loadIntoEditor)
            .catch(utils.failureHandler());
};
