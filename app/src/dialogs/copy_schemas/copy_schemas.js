var serverService = require('../../services/server_service');
var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var fn = require('../../functions');
var bind = require('../../binder');
var Promise = require('bluebird');

module.exports = function(params) {
    var self = this;

    var copyables = params.copyables;
    var specs = [];

    bind(self)
        .obs('index', 0)
        .obs('name', copyables[0].name + " (Copy)")
        .obs('schemaId', copyables[0].schemaId)
        .obs('revision', 1);
    self.closeDialog = root.closeDialog;

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

        Promise.each(specs, fn.handlePromise(serverService.createUploadSchema))
            .then(params.closeCopySchemasDialog)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler(vm, event));
    };
};