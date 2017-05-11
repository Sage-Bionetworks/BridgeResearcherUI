var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.active = params.active;
    self.isNewObs = params.isNewObs;
    self.isPublicObs = params.isPublicObs;
    self.userIdObs = params.userIdObs;

    self.linkMaker = function(postfix) {
        return root.userPath() + self.userIdObs() + '/' + postfix;
    };
};