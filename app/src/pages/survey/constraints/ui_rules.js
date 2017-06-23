var ko = require('knockout');
var fn = require('../../../functions');

module.exports = function(params) {
    var self = this;

    fn.copyProps(self, params, 'rulesObs', 'elementsObs', 'collectionName');

    self.cssTokensObs = ko.computed(function() {
        return self.rulesObs().map(function(rule, index) {
            return self.collectionName+'rules'+index;
        }).join(' ');
    });
};
module.exports.prototype.dispose = function() {
    this.cssTokensObs.dispose();
};