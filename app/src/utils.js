var ko = require('knockout');

module.exports = {
    startHandler: function(vm, event) {
        event.target.classList.add("loading");
        if (vm.errorFields) {
            vm.errorFields.removeAll();
        }
        if (vm.message) {
            vm.message("");
        }
    },
    /**
     * An Ajax success handler for a view model that supports the editing of a form.
     * Turns off the loading indicator on the button used to submit the form, and
     * clears error fields.
     * @param vm
     * @param event
     * @returns {Function}
     */
    successHandler: function(vm, event) {
        return function(response) {
            event.target.classList.remove("loading");
            if (vm.errorFields) {
                vm.errorFields.removeAll();
            }
            return response;
        }
    },
    failureHandler: function(vm, event) {
        return function(response) {
            var json = response.responseJSON;
            event.target.classList.remove("loading");
            if (vm.message) {
                vm.message({text:json.message, 'status': 'error'});
            }
            if (vm.errorFields) {
                if (json.errors) {
                    vm.errorFields.pushAll(Object.keys(json.errors));
                } else {
                    vm.errorFields.removeAll();
                }
            }
            return response;
        }
    },
    observablesFor: function(vm, fields) {
        for (var i=0; i < fields.length; i++) {
            var name = fields[i];
            vm[name] = ko.observable("");
        }
    },
    valuesToObservables: function(vm, object, fields) {
        for (var i=0; i < fields.length; i++) {
            var name = fields[i];
            vm[name](object[name]);
        }
    },
    observablesToObject: function(vm, object, fields) {
        for (var i=0; i < fields.length; i++) {
            var name = fields[i];
            object[name] = vm[name]();
        }
    }
}
