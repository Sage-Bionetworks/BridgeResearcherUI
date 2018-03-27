import ko from 'knockout';

module.exports = function(params) {
    let self = this;

    self.selectedObs = params.selectedObs;
    self.allObs = ko.observableArray(params.allObs().slice());
    self.noneSelected = "No " + params.type + " selected";
    self.dropdown = null;

    params.allObs.subscribe(function(array) {
        self.allObs(params.allObs().slice());
    });
    self.selectedObs.subscribe(function(array) {
        array.sort();
        for (let i=0; i < array.length; i++) {
            self.allObs.remove(array[i]);
        }
    });

    self.addTag = function(item, event) {
        if (self.dropdown === null) {
            self.dropdown = $(event.target.parentNode.parentNode);
        }
        if (self.allObs().length === 1) {
            self.dropdown.dropdown('hide');
        }
        var array = self.selectedObs();
        array.push(item);
        array.sort();
        self.selectedObs(array);
        self.allObs.remove(item);
    };
    self.removeTag = function(item, event) {
        self.selectedObs.remove(item);
        self.allObs.push(item);
    };
};