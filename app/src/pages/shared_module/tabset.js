var ko = require('knockout');

module.exports = function(params) {
    var self = this;
    
    self.versionObs = params.viewModel.versionObs;
    self.idObs = params.viewModel.idObs;
    self.isNewObs = params.viewModel.isNewObs;
    self.publishedObs = params.viewModel.publishedObs;
    self.selected = params.selected;
    
    self.linkMaker = function(tabName) {
        return ko.computed(function() {
            var url = '#/shared_modules/'+encodeURIComponent(self.idObs())+'/versions/'+self.versionObs();
            url += (tabName == 'editor') ? '/editor' : '/history';
            return url;
        });
    };
};