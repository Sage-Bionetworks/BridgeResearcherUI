var criteriaUtils = require('../../criteria_utils');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');
var fn = require('../../functions');

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
    
    var titleUpdated = fn.handleObsUpdate(self.titleObs, 'name');

    self.save = function(vm, event) {
        self.subpopulation = binder.persist(self.subpopulation);
        
        utils.startHandler(vm, event);
        
        var promise = (self.subpopulation.guid) ?
            serverService.updateSubpopulation(self.subpopulation) :
            serverService.createSubpopulation(self.subpopulation);
        promise
            .then(fn.handleStaticObsUpdate(self.isNewObs, false))
            .then(fn.handleObsUpdate(self.guidObs, 'guid'))
            .then(fn.handleCopyProps(params, 'guid'))
            .then(fn.returning(self.subpopulation))
            .then(titleUpdated)
            .then(utils.successHandler(vm, event, "Consent group has been saved."))
            .catch(utils.failureHandler(vm, event));
    };
    
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
                    .then(titleUpdated);
            }
        }).catch(utils.notFoundHandler("Consent group", "subpopulations"));
};