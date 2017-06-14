var ko = require('knockout');
var root = require('../../root');
var fn = require('../../functions');
var utils = require('../../utils');
var binder = require('../../binder');

module.exports = function(params) {
    var self = this;

    binder(self)
        .obs('list[]', params.listObs() || [])
        .obs('value')
        .obs('selectedIndex')
        .obs('currentTab', 'editor')
        .obs('allLists[]', params.otherLists);

    self.handleKeyEvent = function(vm, event) {
        if (event.keyCode === 13 && self.valueObs()) {
            self.valueObs().split(/\W*,\W*/).forEach(function(value) {
                if (value && self.listObs().indexOf(value) === -1) {
                    self.listObs.push(value);
                }
            });
            self.valueObs("");
            return false;
        }
        return true;
    };
    self.removeListItem = function(item) {
        self.listObs.remove(item);
    };
    self.cancel = root.closeDialog;
    self.save = function() {
        params.listObs(self.listObs());
        root.closeDialog();
    };
    self.isActive = function(tag) {
        return tag === self.currentTabObs();
    };
    self.setTab = function(tabName) {
        return function(vm, event) {
            self.currentTabObs(tabName);
        };
    };
    self.selectList = function(item) {
        self.listObs(item);
        self.currentTabObs('editor');
    };
    
};