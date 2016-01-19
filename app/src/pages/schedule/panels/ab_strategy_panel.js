var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../../utils');

module.exports = function(params) {
    var self = this;

    self.labelObs = params.viewModel.labelObs;
    self.scheduleGroupsObs = params.viewModel.scheduleGroupsObs;

    self.groupLabel = function(data, index) {
        return "Group #"+(index()+1)+" ("+data.percentageObs()+"%)";
    };

    self.selectGroup = utils.makeEventToPostboxListener("scheduleGroupSelect");
    self.removeGroup = utils.makeEventToPostboxListener("scheduleGroupRemove");
    self.addGroup = utils.makeEventToPostboxListener("scheduleGroupAdd");
};
