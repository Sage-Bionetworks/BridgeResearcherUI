var ko = require('knockout');
var schemaUtils = require('./schema_utils');

module.exports = function(params) {
    var self = this;

    self.nameObs = params.field.nameObs;
    self.requiredObs = params.field.requiredObs;
    self.typeObs = params.field.typeObs;
    self.publishedObs = params.publishedObs;

    schemaUtils.initFieldDefinitionVM(self);
};