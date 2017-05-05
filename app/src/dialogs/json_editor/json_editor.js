var ko = require('knockout');

/**
 * params:
 *  item - the item being manipulated.
 *  data - a string that represents JSON data
 *  saveFunc - the function to call on save
 */
module.exports = function(params) {
    var self = this;

    self.dataObs = ko.observable(JSON.stringify(params.data));

    self.save = function(vm, event) {
        var string = self.dataObs();
        var jsonData = JSON.parse(string);
        params.saveFunc(params.item, jsonData);
    };
    self.close = params.closeFunc;
};