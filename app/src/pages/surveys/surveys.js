'use strict';

var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

function addCheckedObs(item) {
    item.checkedObs = ko.observable(false);
    return item;
}

function hasBeenChecked(item) {
    return item.checkedObs();
}

function makeDeletionCall(item) {
    return function() {
        return serverService.deleteSurvey(item);
    };
}

function makeRemoveSurveysFromTable(vm, deletables) {
    return function() {
        deletables.forEach(function(deletable) {
            vm.itemsObs.remove(deletable);
        });
    };
}

module.exports = function() {
    var self = this;

    self.messageObs = ko.observable("");
    self.itemsObs = ko.observableArray([]);
    self.formatDateTime = utils.formatDateTime;
    self.publishedObs = ko.observable(false); // for checkboxes

    self.anyChecked = function() {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    }
    self.deleteSurveys = function(vm, event) {
        if (confirm("Are you sure you want to delete these surveys?")) {
            utils.startHandler(self, event);

            var deletables = self.itemsObs().filter(hasBeenChecked);

            deletables.reduce(function(promise, deletable) {
                if (promise === null) {
                    return serverService.deleteSurvey(deletable);
                } else {
                    return promise.then(makeDeletionCall(deletable));
                }
            }, null)
                .then(makeRemoveSurveysFromTable(vm, deletables))
                .then(utils.successHandler(vm, event, "Surveys deleted."))
                .catch(utils.failureHandler(vm, event));
        }
    }

    serverService.getSurveys().then(function(list) {
        if (list.items.length) {
            self.itemsObs(list.items.map(addCheckedObs));
        } else {
            document.querySelector(".loading.status").textContent = "There are currently no surveys.";
        }
    });
};