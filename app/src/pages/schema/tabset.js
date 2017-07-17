import fn from '../../functions';
import ko from 'knockout';

/**
 * params:
 *  viewModel
 *      the parent view model
 */
module.exports = function(params) {
    var self = this;

    fn.copyProps(self, params.viewModel, 'isNewObs','schemaIdObs','revisionObs',
        'publishedObs','moduleIdObs','moduleVersionObs');

    self.linkMaker = function(tabName) {
        return ko.computed(function() { 
            return '#/schemas/'+encodeURIComponent(self.schemaIdObs())+
                '/versions/'+self.revisionObs()+'/'+tabName;
        });
    };
    self.revisionLabel = ko.computed(function() {
        if (self.revisionObs()) {
            return 'v' + self.revisionObs();
        }
        return '';
    });
};
module.exports.prototype.dispose = function() {
    this.revisionLabel.dispose();
};