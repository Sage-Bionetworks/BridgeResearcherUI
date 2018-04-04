import {serverService} from '../../services/server_service';
import utils from '../../utils';
import Binder from '../../binder';

module.exports = function(params) {
    var self = this;

    var binder = new Binder(self)
        .obs('title', params.guid)
        .obs('contentLength')
        .obs('status')
        .obs('requestedOn')
        .obs('completedOn')
        .obs('completedBy')
        .obs('uploadDate')
        .obs('validationMessageList[]');

    self.iconFor = function(item) {
        switch(item.statusObs()) {
            case 'unknown': return 'help circle icon';
            case 'validation_in_progress': return 'refresh icon';
            case 'validation_failed': return 'ui yellow text warning sign icon';
            case 'duplicate': return 'ui yellow text copy icon';
            case 'succeeded': return 'ui green text checkmark icon';
            default: return '';
        }    
    };

    serverService.getUploadById(params.guid)
        .then(binder.update())
        .catch(utils.failureHandler());
};