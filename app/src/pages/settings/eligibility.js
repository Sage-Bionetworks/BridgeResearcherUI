var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');
    
function zeroToMax(value) {
    return (value === 0) ? 121 : value;
}
function maxToZero(value) {
    return (value === "121") ? 0 : parseInt(value);
}

module.exports = function() {
    var self = this;
    self.study = null;
    
    var binder = bind(self)
        .bind('minAgeOfConsent', null, zeroToMax, maxToZero);
    
    self.minAgeLabel = ko.computed(function(){
        return (self.minAgeOfConsentObs() == "121") ? "No age limit" : self.minAgeOfConsentObs();
    });
    self.save = function(vm, event) {
        self.study = binder.persist(self.study);

        utils.startHandler(vm, event);
        serverService.saveStudy(self.study)
            .then(utils.successHandler(self, event, "Study updated."))
            .catch(utils.failureHandler(self, event));
    };
    
    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update('minAgeOfConsent'));
};