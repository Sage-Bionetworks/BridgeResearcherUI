import fn from '../../functions';
import ko from 'knockout';

module.exports = function(params) {
    var self = this;

    self.guidObs = params.guidObs;

    self.createdOnObs = params.createdOnObs;
    self.formatDateTime = fn.formatDateTime;
    self.activeObs = params.activeObs;

    self.computeds = [];
    self.linkMaker = function(tabName) {
        var c = ko.computed(function() {
            return '#/subpopulations/' + self.guidObs() + '/consents/' + tabName;
        });
        self.computeds.push(c);
        return c;
    };
};
module.exports.prototype.dispose = function() {
    this.computeds.forEach(function(c) {
        c.dispose();
    });
};