var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function(keys) {
    var self = this;
    self.keys = keys;

    self.messageObs = ko.observable("");
    self.guidObs = ko.observable(keys.guid);
    self.itemsObs = ko.observableArray([]);
    self.showVersionObs = ko.observable(false);
    self.nameObs = ko.computed(function () {
        if (self.itemsObs().length > 0) {
            return self.itemsObs()[0].name;
        }
        return "";
    });

    self.formatDateTime = utils.formatDateTime;

    self.version = function (vm, event) {
        utils.startHandler(self, event);

        function get(guid) {
            return serverService.getSurveyMostRecentlyPublished(guid).catch(utils.failureHandler(vm, event));
        }
        function version(keys) {
            return serverService.versionSurvey(keys.guid, keys.createdOn).catch(utils.failureHandler(vm, event));
        }
        get(keys.guid).then(version).then(load).then(function(createdOn){
            self.messageObs({text: "A new survey version has been created."});
        });
    };

    function load(survey) {
        serverService.getSurveyAllRevisions(keys.guid).then(function(list) {
            self.itemsObs(list.items);
            // If there are no editable versions, then show a button to create a version
            // off the most recently published version of the survey. This is useful to
            // address situations where the study has been set up outside of the app.
            var hasEditable = list.items.some(function(survey) {
                return !survey.published;
            });
            self.showVersionObs(!hasEditable);
        });
    }
    load(keys);
};