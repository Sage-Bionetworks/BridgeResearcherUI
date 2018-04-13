import {serverService} from '../../services/server_service';
import ko from 'knockout';
import utils from '../../utils';

function mapToObservers(entry) {
    var eventKey = entry[0];
    var period = entry[1];
    return {
        eventKeyObs: ko.observable(eventKey),
        periodObs: ko.observable(period)
    };
}
function obsToMap(accumulator, currentValue) {
    var eventKey = currentValue.eventKeyObs();
    var period = currentValue.periodObs();
    if (eventKey && period) {
        accumulator[eventKey] = period;
    }
    return accumulator;
}

module.exports = function() {
    let self = this;

    self.itemsObs = ko.observableArray([]);

    self.save = function(vm, event) {
        self.study.automaticCustomEvents = self.itemsObs().reduce(obsToMap, {});

        utils.startHandler(vm, event);
        serverService.saveStudy(self.study, false)
            .then(utils.successHandler(vm, event, "Automatic custom events saved."))
            .catch(utils.failureHandler());
    };
    self.addCustomEvent = function(vm, event) {
        self.itemsObs.push(mapToObservers(['','P1D']));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        console.log(study.automaticCustomEvents);
        self.itemsObs(
            Object.entries(study.automaticCustomEvents || {}).map(mapToObservers)
        );
    });
};