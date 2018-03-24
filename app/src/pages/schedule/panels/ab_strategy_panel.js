import fn from '../../../functions';

module.exports = function(params) {
    let self = this;

    fn.copyProps(self, params.viewModel, 'labelObs', 'scheduleGroupsObs', 'selectedElementObs',
        'selectGroup', 'removeGroup', 'addGroup');

    self.groupLabel = function(data, index) {
        return "Group #"+(index()+1)+" ("+data.percentageObs()+"%)";
    };
};
