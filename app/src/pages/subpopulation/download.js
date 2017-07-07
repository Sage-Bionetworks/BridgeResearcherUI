import Binder from '../../binder';
import config from '../../config';
import * as fn from '../../functions';
import serverService from '../../services/server_service';
import utils from '../../utils';

var failureHandler = utils.failureHandler({
    redirectMsg:"Consent group not found.", 
    redirectTo:"subpopulations"
});

module.exports = function(params) {
    var self = this;
    
    new Binder(self)
        .obs('name')
        .obs('guid', params.guid)
        .obs('htmlUrl')
        .obs('pdfUrl');
    
    function updateURLs(session) {
        var host = config.host[session.environment] + "/" + params.guid + "/consent.";
        host = host.replace('https','http');
        host = host.replace('webservices','docs');
        self.htmlUrlObs(host + 'html');
        self.pdfUrlObs(host + 'pdf');
    }

    serverService.getSubpopulation(params.guid)
        .then(fn.handleObsUpdate(self.nameObs, 'name'))
        .then(serverService.getSession)
        .then(updateURLs)
        .catch(failureHandler);    
};