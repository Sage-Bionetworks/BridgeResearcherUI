var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');

var fields = ['name','description','minAppVersion','maxAppVersion','required','noneOfGroups[]','allOfGroups[]'];

module.exports = function(params) {
    var self = this;

    self.isNewObs = ko.observable(params.guid === "new");
    self.requiredObs = ko.observable(false);
    utils.observablesFor(self, fields);
    self.noneOfGroupsEditorObs = ko.observable();
    self.allOfGroupsEditorObs = ko.observable();
    self.dataGroupsOptions = ko.observableArray();
    self.dataGroupsLabel = utils.identity;
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
        utils.startHandler(vm, event);
        utils.observablesToObject(self, self.subpopulation, fields);
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
    self.addToNone = function() {
        var value = self.noneOfGroupsEditorObs();
        if (self.noneOfGroupsObs().indexOf(value) === -1) {
            self.noneOfGroupsObs.push(value);
        }
    };
    self.addToAll = function() {
        var value = self.allOfGroupsEditorObs();
        if (self.allOfGroupsObs().indexOf(value) === -1) {
            self.allOfGroupsObs.push(value);
        }
    };
    self.removeNoneOf = function(tag) {
        self.noneOfGroupsObs.remove(tag);
    };
    self.removeAllOf = function(tag) {
        self.allOfGroupsObs.remove(tag);
    };
    self.formatLink = function(item) {
        return '#/subpopulations/'+params.guid+"/consents/"+ ((item)?item.createdOn:"recent");
    }

    self.formatDateTime = utils.formatDateTime;

    var notFoundHandler = utils.notFoundHandler(self, "Consent group not found.", "#/subpopulations");

    self.newConsentLinkObs(self.formatLink());
    serverService.getStudy().then(function(study) {
        var array = study.dataGroups.map(function(value) {
            return {label: value, value:value};
        });
        self.dataGroupsOptions(array);
        if (params.guid === "new") {
            loadVM({'name':'','description':'','minAppVersion':'','maxAppVersion':'','noneOfGroups':[],'allOfGroups':[]});
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