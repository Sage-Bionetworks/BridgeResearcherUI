var ko = require('knockout');
var utils = require('../../utils');

var DURATION_OPTIONS = Object.freeze([
    {value: 'PT*H', label: 'Hours'},
    {value: 'P*D', label: 'Days'},
    {value: 'P*W', label: 'Weeks'},
    {value: 'P*M', label: 'Months'}
]);
var DURATION_NO_HOURS_OPTIONS = Object.freeze([
    {value: 'P*D', label: 'Days'},
    {value: 'P*W', label: 'Weeks'},
    {value: 'P*M', label: 'Months'}
]);

/**
 * Let's call the numerical portion of the duration the 'amount', and kind of time
 * period being described the 'duration'.
 *
 * @param params
 *  fieldObs - the field this control represents
 *  noHours - if true, no hours will be shown in the dropdown menu
 */
module.exports = function(params) {
    var self = this;

    self.fieldObs = params.fieldObs;
    self.amountObs = ko.observable();
    self.durationObs = ko.observable();

    if (params.noHours === true) {
        self.durationOptions = DURATION_NO_HOURS_OPTIONS;
        self.durationOptionsLabel = utils.makeOptionLabelFinder(DURATION_NO_HOURS_OPTIONS);
    } else {
        self.durationOptions = DURATION_OPTIONS;
        self.durationOptionsLabel = utils.makeOptionLabelFinder(DURATION_OPTIONS);
    }

    function updateSubFields() {
        var value = self.fieldObs();
        if (value) {
            var amt = parseInt(value.replace(/\D/g,''), 10);
            var duration = value.split(/\d+/).join("*");
            if (amt === parseInt(amt,10) && self.durationOptionsLabel(duration) !== '') {
                self.amountObs(amt);
                self.durationObs(duration);
            }
        }
    }
    self.computedUpdateSubFields = ko.computed(updateSubFields);
    self.amountObs.subscribe(updateFieldObs);
    self.durationObs.subscribe(updateFieldObs);

    function updateFieldObs() {
        var amt = self.amountObs();
        var duration = self.durationObs();

        self.fieldObs(null);

        amt = parseInt(amt,10);
        if (typeof amt === 'number' && (amt%1)===0 && self.durationOptionsLabel(duration) !== '' && amt > 0) {
            self.fieldObs(duration.replace('*',amt));
        }
    }
};
module.exports.prototype.dispose = function() {
    this.computedUpdateSubFields.dispose();
};