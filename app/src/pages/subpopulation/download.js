var serverService = require('../../services/server_service');
var config = require('../../config');
var bind = require('../../binder');
var fn = require('../../functions');
var utils = require('../../utils');

var failureHandler = utils.failureHandler({
    redirectMsg:"Consent group not found.", 
    redirectTo:"subpopulations"
});

module.exports = function(params) {
    var self = this;
    
    bind(self)
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