var serverService = require('../../../services/server_service');
var utils = require('../../../utils');
var ko = require('knockout');
var bind = require('../../../binder');

module.exports = function() {
    var self = this;

    var binder = bind(self)
        .bind('maxNumOfParticipants')
        .bind('healthCodeExportEnabled')
        .bind('emailVerificationEnabled');

    self.maxParticipants = ko.computed(function(){
        return (self.maxNumOfParticipantsObs() === "0" || self.maxNumOfParticipantsObs() === 0) ?
                "No limit" : self.maxNumOfParticipantsObs();
    });

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study = binder.persist(self.study);

        console.log(self.study);
        serverService.saveStudy(self.study, true)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .then(function() {
                console.log(self.study);
            })
            .catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .catch(utils.failureHandler());
};
