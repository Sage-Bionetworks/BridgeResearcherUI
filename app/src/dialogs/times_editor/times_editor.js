var ko = require('knockout');
var utils = require('../../utils');
var scheduleService = require('../../services/schedule_service');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.itemsObs = ko.observableArray(params.timesObs());
    self.timesObs = params.timesObs;
    self.clearTimesFunc = params.clearTimesFunc;

    self.timeObs = ko.observable();
    self.timesOptions = scheduleService.timeOptions;
    self.timesLabel = scheduleService.timeOptionsLabel;
    self.publishedObs = ko.observable(false);

    self.addTime = function(vm, event) {
        event.preventDefault();
        var time = scheduleService.timeOptionsFinder(self.timeObs());
        if (self.itemsObs().indexOf(time.value) === -1) {
            self.itemsObs.push(time.value);
            self.itemsObs.sort();
        }
    };
    self.deleteTime = function(vm, event) {
        event.preventDefault();
        var context = ko.contextFor(event.target);
        self.itemsObs.remove(context.$data);
    }
    self.save = function() {
        self.timesObs(self.itemsObs());
        root.closeDialog();
    };
    self.clear = function(vm, event) {
        self.clearTimesFunc(vm, event);
        root.closeDialog();
    };
    self.cancel = function() {
        root.closeDialog();
    };
};