var ko = require('knockout');
var fn = require('../../functions');

module.exports = function(params) {
    var self = this;

    self.formatDateTime = fn.formatDateTime;
    self.guidObs = params.viewModel.guidObs;
    self.createdOnObs = params.viewModel.createdOnObs;
    self.publishedObs = params.viewModel.publishedObs;
    self.selected = params.selected;

    self.linkMaker = function(tabName) {
        return ko.computed(function() {
            var url = '#/surveys/'+self.guidObs();
            if (self.createdOnObs()) {
                var createdOn = self.createdOnObs();
                if (typeof createdOn === "string") {
                    createdOn = new Date(createdOn);
                }
                url += ("/"+createdOn.toISOString());
            }
            if (tabName === 'schema') {
                return url + '/schema';
            } else if (tabName === 'history') {
                return url + '/versions';
            }
            return url;
        });
    };
};