var serverService = require('../../services/server_service');
var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var Promise = require('bluebird');

module.exports = function(params) {
    var self = this;

    var copyables = params.copyables;
    var specs = [];
    var allUpdated = false;

    self.indexObs = ko.observable(0);
    self.nameObs = ko.observable(copyables[0].name + " (Copy)");
    self.schemaIdObs = ko.observable(copyables[0].schemaId);
    self.revisionObs = ko.observable(1);

    function updateObserversFromCopyables() {
        var index = self.indexObs();
        var name = /\(Copy\)$/.test(copyables[index].name) ?
            copyables[index].name :
            copyables[index].name + " (Copy)";
        self.nameObs(name);
        self.schemaIdObs(copyables[index].schemaId);
        self.revisionObs(1);
    }
    function updateSpecsFromObservers() {
        var index = self.indexObs();
        specs[index] = Object.assign({}, copyables[index], {
            name: self.nameObs(),
            schemaId: self.schemaIdObs(),
            revision: self.revisionObs()
        });
    }
    function updateObserversFromSpecs() {
        var index = self.indexObs();
        self.nameObs(specs[index].name);
        self.schemaIdObs(specs[index].schemaId);
        self.revisionObs(specs[index].revision);
    }
    function validValues() {
        return self.schemaIdObs() !== "" && parseInt(self.revisionObs()) > 0;
    }
    function changedValues() {
        var index = self.indexObs();
        return (self.schemaIdObs() != copyables[index].schemaId) || (self.revisionObs() != 1);
    }

    self.canGoPreviousObs = ko.computed(function() {
        return self.indexObs() > 0;
    });
    self.canGoNextObs = ko.computed(function() {
        return validValues() && changedValues() && self.indexObs() < (copyables.length-1);
    });
    self.canCopyObs = ko.computed(function() {
        return validValues() && changedValues() && self.indexObs() === (copyables.length-1);
    });

    self.previous = function() {
        updateSpecsFromObservers();
        self.indexObs(self.indexObs()-1);
        updateObserversFromSpecs();
    };
    self.next = function() {
        updateSpecsFromObservers();
        self.indexObs(self.indexObs()+1);
        if (specs[self.indexObs()]) {
            updateObserversFromSpecs();
        } else {
            updateObserversFromCopyables();
        }
    };
    self.copy = function(vm, event) {
        updateSpecsFromObservers();
        utils.startHandler(vm, event);

        Promise.map(specs, function(schema) {
            return serverService.createUploadSchema(schema);
        }).then(function() {
            params.closeCopySchemasDialog();
        })
        .then(utils.successHandler(vm, event))
        .catch(utils.failureHandler(vm, event));
    };
    self.closeDialog = function() {
        root.closeDialog();
    };
};