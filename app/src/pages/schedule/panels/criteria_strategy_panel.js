module.exports = function(params) {
    let self = this;

    self.labelObs = params.viewModel.labelObs;
    self.scheduleCriteriaObs = params.viewModel.scheduleCriteriaObs;
    self.selectedElementObs = params.viewModel.selectedElementObs;
    
    self.selectCriteria = params.viewModel.selectCriteria;
    self.removeCriteria = params.viewModel.removeCriteria;
    self.addCriteria = params.viewModel.addCriteria;
};
