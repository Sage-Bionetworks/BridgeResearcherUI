import criteriaUtils from '../../criteria_utils';
import ko from 'knockout';
import root from '../../root';

/**
 * Params
 *  criteriaObs - the criteria observer
 */
module.exports = function(params) {
  let self = this;

  self.formatCriteriaObs = ko.computed(function() {
    if (params.criteriaObs()) {
      return criteriaUtils.label(params.criteriaObs());
    }
    return '';
  });

  self.editCriteria = function() {
    root.openDialog('criteria_editor', {
      criteriaObs: params.criteriaObs
    });
  };
  self.clearCriteria = function() {
    params.criteriaObs(criteriaUtils.newCriteria());
  };
};
