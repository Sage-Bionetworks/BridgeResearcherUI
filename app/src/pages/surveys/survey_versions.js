var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function(survey) {
    var self = this;
    self.survey = survey;

    self.messageObs = ko.observable("");
    self.itemsObs = ko.observableArray([]);
    self.nameObs = ko.computed(function() {
        if (self.itemsObs().length > 0) {
            return self.itemsObs()[0].name;
        }
        return "";
    });

    self.formatDateTime = utils.formatDateTime;

    serverService.getSurveyAllRevisions(survey.guid).then(function(list) {
        self.itemsObs(list.items);
    });
};