var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../../utils');

var MAX_LENGTH = 65;

module.exports = function(params) {
    var self = this;

    self.nameObs = params.viewModel.nameObs;
    self.elementsObs = params.viewModel.elementsObs;

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
    self.selectElement = utils.makeEventToPostboxListener("elementsSelect");
    self.removeElement = utils.makeEventToPostboxListener("elementsRemove");
    self.addElement = utils.makeEventToPostboxListener("elementsAdd");
};
