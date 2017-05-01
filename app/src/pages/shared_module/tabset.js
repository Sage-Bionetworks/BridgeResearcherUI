var ko = require('knockout');

module.exports = function(params) {
    var self = this;

    self.versionObs = params.viewModel.versionObs;
    self.idObs = params.viewModel.idObs;
    self.atObs = params.viewModel.atObs;
    self.isNewObs = params.viewModel.isNewObs;
    self.publishedObs = params.viewModel.publishedObs;

    self.isActive = function(tabName) {
        return params.selected === tabName;
    };
    self.linkMaker = function(tabName) {
        return ko.computed(function() {
            var url = '#/shared_modules/'+encodeURIComponent(self.idObs());
            if (tabName == 'editor') {
                url += '/versions/'+self.atObs();
            } else {
                url += '/versions/at/'+self.versionObs();
            }
            return url;
        });
    };
};