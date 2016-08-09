var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');
var ko = require('knockout');
var root = require('../../root');

var BASE = "https://www.synapse.org/#!";

module.exports = function() {
    var self = this;

    var binder = bind(self)
        .bind('synapseDataAccessTeamId')
        .bind('synapseProjectId')
        .bind('usesCustomExportSchedule');

    self.isPublicObs = root.isPublicObs;
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
        self.study = binder.persist(self.study);

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Synapse information saved."))
            .catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update());
};