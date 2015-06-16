var ko = require('knockout');
var serverService = require('../../services/server_service');

function success(vm, event) {
    return function(response) {
        console.log(response);
        event.target.classList.remove("loading");
        vm.errorFields.removeAll();
        return response;
    }
}
function failure(vm, event) {
    return function(response) {
        console.log(response);
        var json = response.responseJSON;
        event.target.classList.remove("loading");
        vm.message({text:json.message, 'status': 'error'});
        if (json.errors) {
            vm.errorFields.pushAll(Object.keys(json.errors));
        } else {
            vm.errorFields.removeAll();
        }
        return response;
    }
}

function observablesFor(vm, fields) {
    for (var i=0; i < fields.length; i++) {
        var name = fields[i];
        vm[name] = ko.observable("");
    }
}
function observe(vm, object, fields) {
    for (var i=0; i < fields.length; i++) {
        var name = fields[i];
        vm[name](object[name]);
    }
}
function marshallFor(vm, fields) {
    for (var i=0; i < fields.length; i++) {
        var name = fields[i];
        vm.study[name] = vm[name]();
    }
}

var fields = ['name', 'sponsorName', 'technicalEmail', 'supportEmail', 'consentNotificationEmail', 'identifier'];

module.exports = function() {
    var self = this;

    // The next step is to just wrap all of this standard stuff up into a function to initialize
    // the viewModel for a standard form view.
    observablesFor(self, fields);
    self.message = ko.observable("");
    self.errorFields = ko.observableArray();

    self.errorFor = function(fieldName) {
        return ko.computed(function() {
            return (self.errorFields.indexOf(fieldName) > -1) ? "error" : "";
        });
    };

    self.save = function(vm, event) {
        event.target.classList.add("loading");
        marshallFor(self, fields);

        serverService.saveStudy(self.study)
            .then(success(vm, event))
            .then(function(response) {
                self.study.version = response.version;
                self.message({text: "Study information saved."});
            }).catch(failure(vm, event));
    };

    serverService.getStudy().then(function(study) {
        self.study = study;
        observe(self, study, fields);
    });
};
