var utils = require('../../../utils');
var ko = require('knockout');
var MAX_LENGTH = 65;

module.exports = function(params) {
    var self = this;

    self.nameObs = params.viewModel.nameObs;
    self.elementsObs = params.viewModel.elementsObs;
    self.selectedElementObs = params.viewModel.selectedElementObs;
    self.selectElement = params.viewModel.selectElement;
    self.removeElement = function(data, event) {
        event.stopPropagation();
        params.viewModel.deleteElement(data, event);
    };

    self.truncate = function(value) {
        if (value && value.length > MAX_LENGTH) {
            return value.split(" ").reduce(function(string, value){
                if (string.length < MAX_LENGTH) {
                    return string + " " + value;
                }
                return string;
            }, "") + "&hellip;";
        }
        return value;
    };
};
