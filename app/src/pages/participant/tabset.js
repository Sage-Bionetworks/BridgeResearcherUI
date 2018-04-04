import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';

module.exports = function(params) {
    let self = this;

    fn.copyProps(self, params, 'isNewObs', 'userIdObs', 'statusObs');

    self.computeds = [];
    self.linkMaker = function(postfix) {
        let c = ko.computed(function() {
            return '#/participants/'+self.userIdObs()+'/'+postfix;
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