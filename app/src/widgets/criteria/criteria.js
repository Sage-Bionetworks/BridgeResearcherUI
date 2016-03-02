var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

var fields = ['minAppVersion','maxAppVersion','language','allOfGroups[]','noneOfGroups[]',
    'noneOfGroupsEditor','allOfGroupsEditor','dataGroupsOptions[]'];

function updateVM(vm, crit) {
    vm.languageObs(crit.language);
    vm.minAppVersionObs(crit.minAppVersion);
    vm.maxAppVersionObs(crit.maxAppVersion);
    vm.allOfGroupsObs(crit.allOfGroups);
    vm.noneOfGroupsObs(crit.noneOfGroups);
}
function updateModel(vm, crit) {
    crit.language = vm.languageObs();
    crit.allOfGroups = vm.allOfGroupsObs();
    crit.noneOfGroups = vm.noneOfGroupsObs();
    if (utils.isNotBlank(vm.minAppVersionObs())) {
        crit.minAppVersion = parseInt(vm.minAppVersionObs(),10);
    }
    if (utils.isNotBlank(vm.maxAppVersionObs())) {
        crit.maxAppVersion = parseInt(vm.maxAppVersionObs(),10);
    }
}

module.exports = function(params) {
    var self = this;
    
    self.id = params.id;
    self.criteriaObs = params.criteriaObs;
    utils.observablesFor(self, fields);
    
    console.log(self);
    
    var crit = self.criteriaObs();
    if (crit) {
        updateVM(self, crit);    
    }

    self.criteriaObs.subscribe(function(crit) {
        updateVM(self, crit);
    });
    self.criteriaObs.criteriaCallback = function() {
        var crit = {};
        updateModel(self, crit);
        return crit;
    };

    self.addToNone = function() {
        var value = self.noneOfGroupsEditorObs();
        if (self.noneOfGroupsObs().indexOf(value) === -1) {
            self.noneOfGroupsObs.push(value);
        }
    };
    self.addToAll = function() {
        var value = self.allOfGroupsEditorObs();
        if (self.allOfGroupsObs().indexOf(value) === -1) {
            self.allOfGroupsObs.push(value);
        }
    };
    self.removeNoneOf = function(tag) {
        self.noneOfGroupsObs.remove(tag);
    };
    self.removeAllOf = function(tag) {
        self.allOfGroupsObs.remove(tag);
    };
    serverService.getStudy().then(function(study) {
        var array = study.dataGroups.map(function(value) {
            return {label: value, value:value};
        });
        self.dataGroupsOptionsObs(array);
    });    
};
