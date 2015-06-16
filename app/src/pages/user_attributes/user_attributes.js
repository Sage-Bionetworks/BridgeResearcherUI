var ko = require('knockout');
var serverService = require('../../services/server_service');

module.exports = function() {
    var self = this;

    self.study = null;
    self.records = ko.observableArray();
    self.addField = ko.observable("");
    self.message = ko.observable("");

    self.remove = function(attribute) {
        self.records.remove(attribute);
    };
    self.add = function() {
        if (!self.addField()) {
            return self.message({text: "You must provide a value for an attribute.", status: "error"});
        }
        if (self.records.contains(self.addField())) {
            return self.message({text: "The attribute must be a unique value.", status: "error"});
        }
        self.records.push(self.addField());
        self.message("");
        self.addField("");
    };
    self.save = function(vm, event) {
        event.target.classList.add("loading");
        self.study.userProfileAttributes = self.records();

        var request = serverService.saveStudy(self.study);
        request.then(function(response) {
            event.target.classList.remove("loading");
            self.study.version = response.version;
            self.message({text: "User attributes saved."});
        }).catch(function(response) {
            event.target.classList.remove("loading");
            self.message({text: response.message, status: "error"});
        });
    };

    var request = serverService.getStudy();
    request.then(function(study) {
        self.study = study;
        self.records.pushAll(study.userProfileAttributes);
    });
    request.catch(function(request) {
        console.error("ERROR", request);
    });

};