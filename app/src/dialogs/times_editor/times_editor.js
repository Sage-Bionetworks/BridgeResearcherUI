var ko = require('knockout');
var scheduleUtils = require('../../pages/schedule/schedule_utils');
var root = require('../../root');

function hourMinuteValue(value) {
    return value.replace(":00.000","");
}

module.exports = function(params) {
    var self = this;

    console.log(params);

    self.itemsObs = ko.observableArray(
        ko.utils.arrayMap(params.timesObs(), hourMinuteValue)
    );
    self.timesObs = params.timesObs;
    self.clearTimesFunc = params.clearTimesFunc;
    self.scheduleType = params.scheduleTypeObs();

    self.timeObs = ko.observable();
    self.timesOptions = scheduleUtils.timeOptions;
    self.timesLabel = scheduleUtils.timeOptionsLabel;

    // When it's only one time, this becomes the control that reflects the
    // state of the schedule, so initialize it.
    if (self.scheduleType === 'once') {
        self.timesObs(params.timesObs()[0]);
    }

    self.addTime = function(vm, event) {
        event.preventDefault();
        var time = scheduleUtils.timeOptionsFinder(self.timeObs());
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
        // Get the time from different places depending on whether
        // it's a list or a single value.
        if (self.scheduleType === 'once') {
            self.timesObs([self.timeObs()]);
        } else {
            self.timesObs(self.itemsObs());
        }
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