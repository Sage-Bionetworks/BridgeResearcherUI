var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../../utils');

module.exports = function(params) {
    var self = this;

    self.labelObs = params.viewModel.labelObs;
    self.scheduleCriteriaObs = params.viewModel.scheduleCriteriaObs;

    self.selectCriteria = utils.makeEventToPostboxListener("scheduleCriteriaSelect");
    self.removeCriteria = utils.makeEventToPostboxListener("scheduleCriteriaRemove");
    self.addCriteria = utils.makeEventToPostboxListener("scheduleCriteriaAdd");
};
