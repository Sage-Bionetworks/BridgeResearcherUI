var ko = require('knockout');

module.exports = function(params) {
    var self = this;
    
    self.emailObs = ko.observable(decodeURIComponent(params.email));
}