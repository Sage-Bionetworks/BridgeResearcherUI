import { Binder } from '../../binder';
import { root } from '../../root';

module.exports = function(params) {
    var self = this;

    new Binder(self)
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
    self.selectList = function(array) {
        self.listObs(array);
        self.currentTabObs('editor');
    };
    
};