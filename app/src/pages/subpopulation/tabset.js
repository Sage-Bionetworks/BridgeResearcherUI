import fn from '../../functions';
import ko from 'knockout';

module.exports = function(params) {
    let self = this;

    fn.copyProps(self, params, 'guidObs', 'createdOnObs', 'activeObs');
    fn.copyProps(self, fn, 'formatDateTime');

    self.computeds = [];
    self.linkMaker = function(tabName) {
        let c = ko.computed(function() {
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