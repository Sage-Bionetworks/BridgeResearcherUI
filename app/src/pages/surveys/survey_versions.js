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
function notAllPublishedChecked(countPublished, countPublishedChecked) {
    return ((countPublished === 0 && countPublishedChecked == 0) ||
            (countPublished !== countPublishedChecked));
}

module.exports = function(keys) {
    var self = this;
    self.keys = keys;

    self.messageObs = ko.observable("");
    self.guidObs = ko.observable(keys.guid);
    self.itemsObs = ko.observableArray([]);
    self.showVersionObs = ko.observable(false);
    self.nameObs = ko.computed(function () {
        if (self.itemsObs().length > 0) {
            return self.itemsObs()[0].name;
        }
        return "";
    });
    self.publishedObs = ko.observable(false); // for checkboxes

    self.formatDateTime = utils.formatDateTime;

    self.anyChecked = function () {
        return self.itemsObs().some(function (item) {
            return item.checkedObs();
        });
    }
    // You can delete anything except the last published item. So count all published items, and all
    // checked published items, and make sure they are not the same and not 1.
    self.oneDeletableChecked = function() {
        var countChecked = 0;
        var countPub = 0;
        var countPubChecked = 0;
        self.itemsObs().forEach(function(item) {
            countChecked += (item.checkedObs()) ? 1 : 0;
            countPub += (item.published) ? 1 : 0;
            countPubChecked += (item.checkedObs() && item.published) ? 1 : 0;
        });
        return (notAllPublishedChecked(countPub, countPubChecked) && countChecked > 0);
    }
    self.oneChecked = function () {
        return self.itemsObs().reduce(function(count, item) {
            return (item.checkedObs()) ? (count+1) : count;
        }, 0) === 1;
    }
    self.deleteSurveys = function(vm, event) {
        var deletables = self.itemsObs().filter(hasBeenChecked);
        var msg = (deletables.length > 2) ?
                "Are you sure you want to delete these survey versions?" :
                "Are you sure you want to delete this survey version?";
        var confirmMsg = (deletables.length > 2) ?
                "Survey versions deleted" : "Survey version deleted.";
        if (confirm(msg)) {
            utils.startHandler(self, event);

            deletables.reduce(function(promise, deletable) {
                if (promise === null) {
                    return serverService.deleteSurvey(deletable);
                } else {
                    return promise.then(makeDeletionCall(deletable));
                }
            }, null)
                    .then(makeRemoveSurveysFromTable(vm, deletables))
                    .then(utils.successHandler(vm, event, confirmMsg))
                    .catch(utils.failureHandler(vm, event));
        }
    }
    self.version = function (vm, event) {
        utils.startHandler(self, event);

        var keys = self.itemsObs().filter(function(item) {
            return item.checkedObs();
        })[0];
        serverService.versionSurvey(keys.guid, keys.createdOn)
                .then(load)
                .then(utils.successHandler(vm, event, "A new survey version has been created."))
                .catch(utils.failureHandler(vm, event));
    };

    function load(survey) {
        serverService.getSurveyAllRevisions(keys.guid).then(function(list) {
            self.itemsObs(list.items.map(addCheckedObs));
        });
        return survey.createdOn;
    }
    load(keys);
};