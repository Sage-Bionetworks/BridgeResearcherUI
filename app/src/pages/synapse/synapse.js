var serverService = require('../../services/server_service');
var utils = require('../../utils');
var ko = require('knockout');
var fields = ['synapseDataAccessTeamId', 'synapseProjectId', 'usesCustomExportSchedule'];

var BASE = "https://www.synapse.org/#!";

module.exports = function() {
    var self = this;

    utils.observablesFor(self, fields);

    self.projectLinkObs = ko.computed(function() {
        var value = self.synapseProjectIdObs();
        return (value) ? (BASE+"Synapse:"+value) : null;
    });
    self.teamLinkObs = ko.computed(function() {
        var value = self.synapseDataAccessTeamIdObs();
        return (value) ? (BASE+"Team:"+value) : null;
    });

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        utils.observablesToObject(self, self.study, fields);

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Synapse information saved."))
            .catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        utils.valuesToObservables(self, study, fields);
    });
};
