import {serverService} from '../../../services/server_service';
import Binder from '../../../binder';
import fn from '../../../functions';
import ko from 'knockout';
import root from '../../../root';
import storeService from '../../../services/store_service';
import tables from '../../../tables';
import utils from '../../../utils';

module.exports = function() {
    let self = this;

    self.uploadDetailsObs = ko.observable();
    self.findObs = ko.observable();
    self.uploadDetailsObs = ko.observable();

    self.doSearch = function(event) {
        utils.clearErrors();
        let id = self.findObs();
        if (id) {
            event.target.parentNode.parentNode.classList.add("loading");
            let success = (response) => {
                event.target.parentNode.parentNode.classList.remove("loading");
                serverService.getUploadById(response.uploadId).then((response) => {
                    self.uploadDetailsObs(response);
                }).catch(utils.failureHandler());
            };
    
            utils.startHandler(self, event);
            serverService.getUploadById(id).then(success).catch(function() {
                serverService.getUploadByRecordId(id).then(success).catch(function(e) {
                    event.target.parentNode.parentNode.classList.remove("loading");
                    utils.failureHandler({transient:false})(e);
                });
            });
        }
    };
};