var ko = require('knockout');

module.exports = function(params) {
    var self = this;
    
    self.versionObs = params.viewModel.versionObs;
    self.idObs = params.viewModel.idObs;
    self.isNewObs = params.viewModel.isNewObs;
    self.publishedObs = params.viewModel.publishedObs;
    self.selected = params.selected;

    self.computeds = [];
    self.linkMaker = function(tabName) {
        var c = ko.computed(function() {
            var url = '#/shared_modules/'+encodeURIComponent(self.idObs())+'/versions/'+self.versionObs();
            url += (tabName == 'editor') ? '/editor' : '/history';
            return url;
        });
        self.computeds.push(c);
        return c;
    };
};
module.exports.prototype.dispose = function() {
    self.computeds.forEach(function(c) {
        c.dispose();
    });
};