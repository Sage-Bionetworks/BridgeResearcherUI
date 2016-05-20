var utils = require('../../../utils');
var serverService = require('../../../services/server_service');
var ko = require('knockout');

var fields = ['maxNumOfParticipants', 'healthCodeExportEnabled', 'emailVerificationEnabled'];

module.exports = function() {
    var self = this;

    utils.observablesFor(self, fields);

    self.maxParticipants = ko.computed(function(){
        return (self.maxNumOfParticipantsObs() === "0" || self.maxNumOfParticipantsObs() === 0) ?
                "No limit" : self.maxNumOfParticipantsObs();
    });

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        utils.observablesToObject(self, self.study, fields);

        serverService.saveStudy(self.study, true)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
    })
    .catch(utils.failureHandler());
};
