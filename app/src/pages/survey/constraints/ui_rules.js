import fn from '../../../functions';
import ko from 'knockout';

module.exports = function(params) {
    var self = this;

    fn.copyProps(self, params, 'element', 'fieldName', 'elementsObs', 'collectionName');
    self.rulesObs = self.element[self.fieldName];
    self.fieldProperty = self.fieldName.replace("Obs","");

    self.cssTokensObs = ko.computed(function() {
        return self.rulesObs().map(function(rule, index) {
            return self.collectionName+'rules'+index;
        }).join(' ');
    });
};
module.exports.prototype.dispose = function() {
    this.cssTokensObs.dispose();
};