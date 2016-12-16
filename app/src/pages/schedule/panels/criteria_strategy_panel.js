var utils = require('../../../utils');
var ko = require('knockout');
require('knockout-postbox');

module.exports = function(params) {
    var self = this;

    self.labelObs = params.viewModel.labelObs;
    self.scheduleCriteriaObs = params.viewModel.scheduleCriteriaObs;
    self.selectedElementObs = params.viewModel.selectedElementObs;
    
    self.selectCriteria = params.viewModel.selectCriteria;
    self.removeCriteria = params.viewModel.removeCriteria;
    self.addCriteria = params.viewModel.addCriteria;
};
