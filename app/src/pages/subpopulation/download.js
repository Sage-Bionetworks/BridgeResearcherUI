import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import config from '../../config';
import fn from '../../functions';
import utils from '../../utils';

const failureHandler = utils.failureHandler({
    redirectMsg:"Consent group not found.", 
    redirectTo:"subpopulations"
});

module.exports = function(params) {
    let self = this;
    
    new Binder(self)
        .obs('name')
        .obs('guid', params.guid)
        .obs('createdOn', params.createdOn)
        .obs('publishedConsentCreatedOn')
        .obs('htmlUrl')
        .obs('pdfUrl');
    
    function updateURLs(session) {
        let host = config.host[session.environment] + "/" + params.guid + "/consent.";
        host = host.replace('https','http');
        host = host.replace('ws','docs');
        self.htmlUrlObs(host + 'html');
        self.pdfUrlObs(host + 'pdf');
    }

    serverService.getSubpopulation(params.guid)
        .then(fn.handleObsUpdate(self.nameObs, 'name'))
        .then(fn.handleObsUpdate(self.publishedConsentCreatedOnObs, 'publishedConsentCreatedOn'))
        .then(serverService.getSession.bind(serverService))
        .then(updateURLs)
        .catch(failureHandler);    
};