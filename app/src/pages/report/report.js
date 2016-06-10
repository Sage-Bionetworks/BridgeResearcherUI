var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
var jsonFormatter = require('../../json_formatter');

function startDate() {
    var d = new Date();
    d.setDate(d.getDate() - 21);
    return d.toISOString().split("T")[0];
}
function endDate() {
    return new Date().toISOString().split("T")[0];
}

module.exports = function(params) {
    var self = this;

    self.identifierObs = ko.observable(params.id);
    self.itemsObs = ko.observableArray([]);
    self.isDeveloper = root.isDeveloper;
    
    self.addReport = function(vm, event) {
        root.openDialog('add_report', {
            closeDialog: self.closeDialog, 
            identifier: params.id
        });
    };
    self.closeDialog = function() {
        root.closeDialog();
        load();
    };
    self.toggle = function(model) {
        model.checkedObs(!model.checkedObs());
    };

    function load() {
        serverService.getStudyReport(params.id, startDate(), endDate())
            .then(function(response) {
                response.items = response.items.map(utils.addCheckedObs).map(function(item) {
                    item.checkedObs(true);
                    try {
                        var json = JSON.parse(item.data);
                        item.data = jsonFormatter(json);
                    } catch(e) {
                        item.checkedObs(false);    
                    }
                    return item;
                });
                self.itemsObs(response.items.sort());
            });
    }
    load();
};