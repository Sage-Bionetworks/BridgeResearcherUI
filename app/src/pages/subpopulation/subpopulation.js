var ko = require('knockout');
var criteriaUtils = require('../../criteria_utils');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');

var fields = ['name','description','required','criteria'];

function newSubpop() {
    return {'name':'','description':'','criteria':criteriaUtils.newCriteria()};
}

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .obs('isNew', params.guid === "new")
        .bind('name', '')
        .bind('description')
        .bind('required', false)
        .bind('criteria')
        .bind('historyItems[]', []);

    function updateHistoryItems(data) {
        self.historyItemsObs(data.items.slice(0, 5));
    }
    function noLongerNew(response) {
        self.isNewObs(false);
        return response;
    }
    self.save = function(vm, event) {
        self.subpopulation = binder.persist(self.subpopulation);
        
        utils.startHandler(vm, event);
        if (self.subpopulation.guid) {
            serverService.updateSubpopulation(self.subpopulation)
                .then(noLongerNew)
                .then(utils.successHandler(vm, event, "Consent group has been saved."))
                .catch(utils.failureHandler(vm, event));
        } else {
            serverService.createSubpopulation(self.subpopulation)
                .then(noLongerNew)
                .then(function(response) {
                    params.guid = response.guid;
                    serverService.getConsentHistory(params.guid).then(updateHistoryItems);
                    self.publishedLinkObs(self.formatLink());
                })
                .then(utils.successHandler(vm, event, "Consent group has been saved."))
                .catch(utils.failureHandler(vm, event));
        }
    };
    self.formatLink = function(item) {
        return '#/subpopulations/'+params.guid+"/consents/"+ ((item)?item.createdOn:"recent");
    }
    self.formatDateTime = utils.formatDateTime;
    self.publishedLinkObs = ko.observable(self.formatLink());
    
    var notFoundHandler = utils.notFoundHandler(self, "Consent group not found.", "#/subpopulations");

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(function(study) {
            var promise = (params.guid === "new") ?
                Promise.resolve(newSubpop()) :
                serverService.getSubpopulation(params.guid);
            
            promise.then(binder.assign('subpopulation'))
                .then(binder.update())
                .catch(notFoundHandler);
            
            if (params.guid !== "new") {
                serverService.getConsentHistory(params.guid).then(updateHistoryItems);    
            }
        });
};