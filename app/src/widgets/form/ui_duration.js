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
    self.amountObs = ko.observable();
    self.durationObs = ko.observable();

    self.durationOptions = DURATION_OPTIONS;
    self.durationOptionsLabel = utils.makeFinderByLabel(DURATION_OPTIONS);

    function updateSubFields() {
        var value = self.fieldObs();
        if (value) {
            var amt = parseInt(value.replace(/\D/g,''), 10);
            var duration = value.split(/\d+/).join("*");
            if (amt === parseInt(amt,10) && self.durationOptionsLabel(duration) !== '') {
                self.amountObs(amt);
                self.durationObs(duration);
            } else {
                console.error("fieldObs invalid, not setting amountObs/durationObs", value);
            }
        }
    }
    ko.computed(updateSubFields);
    self.amountObs.subscribe(updateFieldObs);
    self.durationObs.subscribe(updateFieldObs);

    function updateFieldObs() {
        var amt = self.amountObs();
        var duration = self.durationObs();

        amt = parseInt(amt,10);
        if (typeof amt === 'number' && (amt%1)===0 && self.durationOptionsLabel(duration) !== '') {
            self.fieldObs(duration.replace('*',amt));
            console.debug("setting fieldObs", self.fieldObs());
        } else {
            console.debug("duration values invalid, not updating fieldObs", amt, duration);
        }
    }
}