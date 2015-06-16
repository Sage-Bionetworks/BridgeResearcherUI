var ko = require('knockout');
var serverService = require('../../services/server_service');

// Candidates for a common utilities class. Could curry these so they can be added
// to promise handlers directly
function success(vm, event) {
    return function() {
        event.target.classList.remove("loading");
        vm.errorFields.removeAll();
    }
}
function failure(vm, event) {
    return function(response) {
        var json = response.responseJSON;
        event.target.classList.remove("loading");
        vm.message({text:json.message, 'status': 'error'});
        if (json.errors) {
            vm.errorFields.pushAll(Object.keys(json.errors));
        } else {
            vm.errorFields.removeAll();
        }
    }
}

module.exports = function() {
    var self = this;

    self.study = null;
    self.subject = ko.observable("");
    self.body = ko.observable("");
    self.message = ko.observable("");
    self.errorFields = ko.observableArray();

    serverService.getStudy().then(function(study) {
        self.study = study;
        self.subject(study.resetPasswordTemplate.subject);
        self.body(study.resetPasswordTemplate.body);
        CKEDITOR.instances.rpTemplate.setData(study.resetPasswordTemplate.body);
    });

    self.errorFor = function(fieldName) {
        return ko.computed(function() {
            return (self.errorFields.indexOf(fieldName) > -1) ? "error" : "";
        });
    };

    self.save = function(vm, event) {
        event.target.classList.add("loading");
        self.study.resetPasswordTemplate.subject = self.subject();
        self.study.resetPasswordTemplate.body = CKEDITOR.instances.rpTemplate.getData();

        serverService.saveStudy(self.study)
            .then(success(vm, event))
            .then(function(response) {
                self.message({text:"Email saved."});
                self.study.version = response.version;
            }).catch(failure(vm, event));
    };
};