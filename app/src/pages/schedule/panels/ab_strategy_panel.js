
module.exports = function(params) {
    var self = this;

    self.labelObs = params.viewModel.labelObs;
    self.scheduleGroupsObs = params.viewModel.scheduleGroupsObs;
    self.selectedElementObs = params.viewModel.selectedElementObs;

    self.selectGroup = params.viewModel.selectGroup;
    self.removeGroup = params.viewModel.removeGroup;
    self.addGroup = params.viewModel.addGroup;

    self.groupLabel = function(data, index) {
        return "Group #"+(index()+1)+" ("+data.percentageObs()+"%)";
    };
};
