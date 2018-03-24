import fn from '../../../functions';

module.exports = function(params) {
    let self = this;

    fn.copyProps(self, params.viewModel, 'labelObs', 'scheduleCriteriaObs', 'selectedElementObs',
        'selectCriteria', 'removeCriteria', 'addCriteria');
};
