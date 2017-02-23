var serverService = require('../../services/server_service');
var root = require('../../root');
var utils = require('../../utils');
var tables = require('../../tables');
var ko = require('knockout');

module.exports = function(params) {
    var self = this;

    self.cancel = root.closeDialog;

    self.select = function() {
        var surveys = self.itemsObs().filter(function(object) {
            return object.checkedObs();
        });
        params.addSurveys(surveys);
    };
    self.toggleChecked = function(item) {
        item.checkedObs(!item.checkedObs());
    };

    tables.prepareTable(self, {
        name: "survey",
        type: "Survey",
        refresh: load
    });

    function isSelected(survey) {
        return !!match(survey);
    }
    function notSelected(survey) {
        return !isSelected(survey);
    }
    function match(survey) {
        return params.selected.filter(function(selectedSurvey) {
            return (selectedSurvey.guid === survey.guid);
        })[0];
    }
    function surveyToView(survey) {
        var obj = {guid: survey.guid, name: survey.name};
        var selectedSurvey = match(survey);
        if (selectedSurvey) {
            obj.createdOn = selectedSurvey.createdOn;
        }
        obj.checkedObs = ko.observable(!!selectedSurvey);
        return obj;
    }

    function load() { 
        serverService.getPublishedSurveys().then(function(response) {
            var selected = response.items.filter(isSelected).map(surveyToView);
            var rest = response.items.filter(notSelected).map(surveyToView);
            self.itemsObs.pushAll(selected);
            self.itemsObs.pushAll(rest);
        }).catch(utils.failureHandler());
    }
    load();
};
