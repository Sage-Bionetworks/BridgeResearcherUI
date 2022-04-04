import BaseStudy from "./base_study";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default class StudyAdherenceStats extends BaseStudy {
  constructor(params) {
    super(params, 'adherence-stats');
    this.studyId = params.studyId;
    this.study = null;

    this.binder
      .obs('adherenceThresholdPercentage')
      .obs('compliant')
      .obs('noncompliant')
      .obs('totalActive')
      .obs('entries[]', [])
      .obs('noncompliantLink', null, (r) => {
        let param = parseInt(this.adherenceThresholdPercentageObs())-1;
        return `./weekly?adh.adherenceMin=0&adh.adherenceMax=${param}`;
      })
      .obs('compliantLink', null, (r) => {
        let param = this.adherenceThresholdPercentageObs();
        return `./weekly?adh.adherenceMin=${param}&adh.adherenceMax=100`;
      })
      .obs('thresholdPercentDisplay', null, (r) => {
        let value = this.adherenceThresholdPercentageObs();
        console.log(value);
        return (/\d+/.test(value)) ? (parseInt(value) + '%') : '—';
      });
    super.load()
      .then(() => serverService.getStudyAdherenceReportStatistics(this.studyId))
      .then(this.binder.update())
      .then(res => this.entriesObs(res.entries))
      .catch(utils.failureHandler({id: 'adherence-stats'}));
  }
  inWeekLink(item) {
    let param = encodeURIComponent(item.searchableLabel);
    return `./weekly?adh.labelFilters=${param}`;
  }
}