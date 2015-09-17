var ko = require('knockout');
var utils = require('../../utils');

var DURATION_OPTIONS = Object.freeze([
    {value: 'PT*H', label: 'Hours'},
    {value: 'P*D', label: 'Days'},
    {value: 'P*W', label: 'Weeks'},
    {value: 'P*M', label: 'Months'}
]);

/**
 * Let's call the numerical portion of the duration the 'amount', and kind of time
 * period being described the 'duration'.
 *
 * @param params
 */
module.exports = function(params) {
    var self = this;

    self.fieldObs = params.fieldObs;
    var amount = 0;
    var duration = "P*D";
    var value = self.fieldObs();
    if (value) {
        amount = parseInt(value.replace(/[^\d]*/g,''));
        duration = value.replace(/[^\D]+/g,'*');
    }
    self.amountObs = ko.observable(amount);
    self.durationObs = ko.observable(duration);

    ko.computed(function() {
        var amt = self.amountObs();
        var dur = self.durationObs();
        if (amt !== 0) {
            var finalValue = dur.replace("*",amt);
            self.fieldObs(finalValue);
            //console.log("Updated bound observer to the value",finalValue);
        } else {
            self.fieldObs(null);
            //console.log("Updated bound observer to the value null");
        }
    });

    self.durationOptions = DURATION_OPTIONS;
    self.durationOptionsLabel = utils.makeFinderByLabel(DURATION_OPTIONS);
}