import fn from '../../functions';
import ko from 'knockout';

module.exports = function(params) {
    let self = this;

    fn.copyProps(self, params, 'guidObs', 'createdOnObs', 'publishedConsentCreatedOnObs', 'isNewObs');
    fn.copyProps(self, fn, 'formatDateTime');

    // Only passed in on the on the general tab
    if (!self.isNewObs) {
        self.isNewObs = ko.observable(false);
    }
    self.activeObs = ko.computed(function() {
        return self.createdOnObs() === self.publishedConsentCreatedOnObs();
    });

    self.computeds = [];
    self.linkMaker = function(tabName) {
        let c = ko.computed(function() {
            var timestamp = self.createdOnObs();
            if (!timestamp) {
                timestamp = 'recent';
            }
            return '#/subpopulations/' + self.guidObs() + '/consents/' + timestamp + '/' + tabName;
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