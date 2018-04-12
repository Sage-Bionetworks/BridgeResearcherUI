import {serverService} from '../../services/server_service';
import ko from 'knockout';

function mapToObservers(entry) {
    var eventKey = entry[0];
    var period = entry[1];
    return {
        entryKeyObs: ko.observable(eventKey),
        periodObs: ko.observable(period)
    };
}
function obsToMap(item) {

}

module.exports = function() {
    let self = this;

    self.itemsObs = ko.observableArray();

    serverService.getStudy().then(function(response) {
        self.itemsObs(
            Object.entries(response.automaticCustomEvents).map(mapToObservers)
        );
    });
};