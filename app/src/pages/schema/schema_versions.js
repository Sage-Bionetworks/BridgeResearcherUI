var serverService = require('../../services/server_service');
var criteriaUtils = require('../../criteria_utils');
var tables = require('../../tables');
var bind = require('../../binder');
var fn = require('../../functions');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('name')
        .obs('revision', params.revision)
        .obs('schemaId', params.schemaId);

    tables.prepareTable(self, {
        name: 'schema'
    });

    fn.copyProps(self, criteriaUtils, 'label->criteriaLabel');

    self.revisionLabel = ko.computed(function() {
        if (self.revisionObs()) {
            return 'v' + self.revisionObs();
        }
        return '';
    });
    self.link = function(item) {
        return "#/schemas/"+encodeURIComponent(item.schemaId)+"/versions/"+item.revision+'/editor';
    };
    serverService.getUploadSchemaAllRevisions(params.schemaId)
        .then(fn.handleObsUpdate(self.itemsObs, 'items'))
        .then(function(response) {
            if (response.items.length) {
                self.nameObs(response.items[0].name);
            }
        });
};
module.exports.prototype.dispose = function() {
    this.revisionLabel.dispose();
};