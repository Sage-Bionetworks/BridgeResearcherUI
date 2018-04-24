import {serverService} from '../../../services/server_service';
import Binder from '../../../binder';
import fn from '../../../functions';
import ko from 'knockout';
import root from '../../../root';
import storeService from '../../../services/store_service';
import tables from '../../../tables';
import utils from '../../../utils';

const PAGE_KEY = 'findUpload';

module.exports = function() {
    let self = this;
    let query = storeService.restoreQuery(PAGE_KEY);

    self.findObs = ko.observable(query.externalId || '');
    self.uploadDetailsObs = ko.observable();
    self.isLoadingObs = ko.observable(false);

    self.doSearch = function(event) {
        utils.clearErrors();
        let id = self.findObs();
        if (id) {
            storeService.persistQuery(PAGE_KEY, {externalId: id});
            self.isLoadingObs(true);
            let success = (response) => {
                self.isLoadingObs(false);
                serverService.getUploadById(response.uploadId).then((response) => {
                    self.uploadDetailsObs(response);
                }).catch(utils.failureHandler());
            };
    
            utils.startHandler(self, event);
            serverService.getUploadById(id).then(success).catch(function() {
                serverService.getUploadByRecordId(id).then(success).catch(function(e) {
                    self.isLoadingObs(false);
                    utils.failureHandler({transient:false})(e);
                });
            });
        } else {
            storeService.persistQuery(PAGE_KEY, {externalId: ""});
        }
    };

    if (self.findObs() !== '') {
        self.doSearch({});
    }
};