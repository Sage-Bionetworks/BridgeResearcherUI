import {ServerService} from '../../services/server_service';
import batchDialogUtils from '../../batch_dialog_utils';
import Binder from '../../binder';
import fn from '../../functions';
import Promise from 'bluebird';
import root from '../../root';
import saveAs from '../../../lib/filesaver.min.js';
import utils from '../../utils';
import ko from 'knockout';

var serverService = new ServerService(false);

module.exports = function(params) {
    var self = this;
    
    self.identifierObs = ko.observable();
    self.close = root.closeDialog;

    function getId(id) {
        return serverService.getParticipant(id);
    }
    function getHealthCode(id) {
        return serverService.getParticipant("healthCode:"+id);
    }
    function getExternalId(id) {
        return serverService.getParticipant("externalId:"+id);
    }
    function makeSuccess(vm, event) {
        return function(response) {
            utils.successHandler(vm, event);
            self.close();
            document.location = '#/participants/'+response.id+'/general';
        };
    }

    self.find = function(vm, event) {
        var id = self.identifierObs();
        var success = makeSuccess(vm, event);

        utils.startHandler(vm, event);
        getId(id).then(success).catch(function() {
            getHealthCode(id).then(success).catch(function() {
                getExternalId(id).then(success).catch(utils.failureHandler());
            });
        });
    };
};
