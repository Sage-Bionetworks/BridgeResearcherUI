var ko = require('knockout');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.participant = params;
    
    self.close = function() {
        root.closeDialog();
    }
}