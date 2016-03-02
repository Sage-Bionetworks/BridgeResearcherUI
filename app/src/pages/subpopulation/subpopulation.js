var ko = require('knockout');
var criteriaUtils = require('../../criteria_utils');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');

var fields = ['name','description','required','criteria'];

var newSubpop = {'name':'','description':'','criteria':criteriaUtils.newCriteria()};

module.exports = function(params) {
    var self = this;

    utils.observablesFor(self, fields);
    self.isNewObs = ko.observable(params.guid === "new");
    self.requiredObs = ko.observable(false);
    self.historyItemsObs = ko.observable([]);
    self.newConsentLinkObs = ko.observable();
    self.isDeveloper = root.isDeveloper;
    self.isResearcher = root.isResearcher;

    function updateHistoryItems(data) {
        self.historyItemsObs(data.items.slice(0, 5));
    }
    function loadVM(response) {
        self.subpopulation = response;
        utils.valuesToObservables(self, self.subpopulation, fields);
    }
    self.save = function(vm, event) {
        utils.observablesToObject(self, self.subpopulation, fields);
        self.subpopulation.criteria = self.criteriaObs.criteriaCallback();
        
        utils.startHandler(vm, event);
        if (self.subpopulation.guid) {
            serverService.updateSubpopulation(self.subpopulation)
                .then(utils.successHandler(vm, event, "Consent group has been saved."))
                .then(function(response) {
                    self.subpopulation.version = response.version;
                    self.isNewObs(false);
                })
                .catch(utils.failureHandler(vm, event));
        } else {
            serverService.createSubpopulation(self.subpopulation)
                .then(utils.successHandler(vm, event, "Consent group has been saved."))
                .then(function(response) {
                    self.subpopulation.guid = response.guid;
                    self.subpopulation.version = response.version;
                    self.isNewObs(false);
                    params.guid = response.guid;
                    self.newConsentLinkObs(self.formatLink());
                    serverService.getConsentHistory(params.guid).then(updateHistoryItems);
                })
                .catch(utils.failureHandler(vm, event));
        }
    };
    self.formatLink = function(item) {
        return '#/subpopulations/'+params.guid+"/consents/"+ ((item)?item.createdOn:"recent");
    }

    self.formatDateTime = utils.formatDateTime;

    var notFoundHandler = utils.notFoundHandler(self, "Consent group not found.", "#/subpopulations");

    self.newConsentLinkObs(self.formatLink());
    serverService.getStudy().then(function(study) {
        if (params.guid === "new") {
            loadVM(newSubpop);
        } else if (params.guid) {
            serverService.getStudy().then(function(study) {
                serverService.getSubpopulation(params.guid).then(loadVM).catch(notFoundHandler);
            });
        } else {
            notFoundHandler();
        }
    });
    serverService.getConsentHistory(params.guid).then(updateHistoryItems);
};