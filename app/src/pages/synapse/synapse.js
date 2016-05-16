var serverService = require('../../services/server_service');
var utils = require('../../utils');
var ko = require('knockout');
var fields = ['synapseDataAccessTeamId', 'synapseProjectId'];

var BASE = "https://www.synapse.org/#!";

module.exports = function() {
    var self = this;

    utils.observablesFor(self, fields);

    function updateVersion(response) {
        self.study.version = response.version;
    }
    self.projectLinkObs = ko.computed(function() {
        return BASE + "Synapse:" + self.synapseProjectIdObs(); 
    });
    self.teamLinkObs = ko.computed(function() {
        return BASE + "Team:" + self.synapseDataAccessTeamIdObs(); 
    });

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        utils.observablesToObject(self, self.study, fields);

        serverService.saveStudy(self.study)
            .then(updateVersion)
            .then(utils.successHandler(vm, event, "Synapse information saved."))
            .catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
    });
};
