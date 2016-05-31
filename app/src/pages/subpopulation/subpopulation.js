var ko = require('knockout');
var criteriaUtils = require('../../criteria_utils');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');

function newSubpop() {
    return {'name':'','description':'','criteria':criteriaUtils.newCriteria()};
}

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .obs('isNew', params.guid === "new")
        .obs('guid')
        .obs('title', 'New Consent Group')
        .bind('name')
        .bind('description')
        .bind('required', true)
        .bind('criteria');

    function noLongerNew(response) {
        self.isNewObs(false);
        self.guidObs(response.guid);
        self.nameObs(self.subpopulation.name);
        self.titleObs(self.subpopulation.name);
        params.guid = response.guid;
        return response;
    }
    function updateTitle(response) {
        self.titleObs(response.name);
        return response;
    }
    
    self.save = function(vm, event) {
        self.subpopulation = binder.persist(self.subpopulation);
        
        utils.startHandler(vm, event);
        
        var promise = (self.subpopulation.guid) ?
            serverService.updateSubpopulation(self.subpopulation) :
            serverService.createSubpopulation(self.subpopulation);
        promise.then(noLongerNew)
            .then(utils.successHandler(vm, event, "Consent group has been saved."))
            .catch(utils.failureHandler(vm, event));
    };
    
    var notFoundHandler = utils.notFoundHandler(self, "Consent group not found.", "#/subpopulations");

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(function(study) {
            if (params.guid === "new") {
                return Promise.resolve(newSubpop())
                    .then(binder.assign('subpopulation'));
            } else {
                return serverService.getSubpopulation(params.guid)
                    .then(binder.assign('subpopulation'))
                    .then(binder.update())
                    .then(updateTitle);
            }
        }).catch(notFoundHandler);
};