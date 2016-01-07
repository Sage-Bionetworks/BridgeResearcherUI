var serverService = require('../../services/server_service');
var utils = require('../../utils');

var fields = ['synapseDataAccessTeamId', 'synapseProjectId'];

module.exports = function() {
    var self = this;

    utils.observablesFor(self, fields);

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        utils.observablesToObject(self, self.study, fields);

        serverService.saveStudy(self.study)
            .then(function(response) {
                self.study.version = response.version;
            })
            .then(utils.successHandler(vm, event, "Synapse information saved."))
            .catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
    });
};
