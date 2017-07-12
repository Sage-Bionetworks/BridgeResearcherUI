import fn from '../../functions';
import ko from 'knockout';

const POSTFIXES = {
    'schema': '/schema',
    'history': '/versions',
    'editor': '/editor'
};

module.exports = function(params) {
    var self = this;

    self.formatDateTime = fn.formatDateTime;
    self.guidObs = params.viewModel.guidObs;
    self.createdOnObs = params.viewModel.createdOnObs;
    self.publishedObs = params.viewModel.publishedObs;

    self.computeds = [];
    self.linkMaker = function(tabName) {
        var c = ko.computed(function() {
            var url = '#/surveys/'+self.guidObs();
            if (self.createdOnObs()) {
                var createdOn = self.createdOnObs();
                if (typeof createdOn === "string") {
                    createdOn = new Date(createdOn);
                }
                url += ("/"+createdOn.toISOString());
            }
            url += POSTFIXES[tabName];
            return url;
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