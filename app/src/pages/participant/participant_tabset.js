import { root } from '../../root';

module.exports = function(params) {
    var self = this;

    self.active = params.active;
    self.isNewObs = params.isNewObs;
    self.isPublicObs = params.isPublicObs;
    self.userIdObs = params.userIdObs;
    self.statusObs = params.statusObs;

    self.linkMaker = function(postfix) {
        return root.userPath() + self.userIdObs() + '/' + postfix;
    };
};