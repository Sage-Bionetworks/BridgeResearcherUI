var serverService = require('../../services/server_service');
var config = require('../../config');
var bind = require('../../binder');

module.exports = function(params) {
    var self = this;
    
    bind(self)
        .obs('name')
        .obs('guid', params.guid)
        .obs('htmlUrl')
        .obs('pdfUrl');
    
    serverService.getSubpopulation(params.guid).then(function(subpop) {
        self.nameObs(subpop.name);
    });
    serverService.getSession().then(function(session) {
        var host = config.host[session.environment] + "/" + params.guid + "/consent.";
        host = host.replace('https','http');
        host = host.replace('webservices','docs');
        self.htmlUrlObs(host + 'html');
        self.pdfUrlObs(host + 'pdf');
    });    
};