var define = require('../define');
var ko = require('knockout');

module.exports = define({
    init: function() {
        this.username = ko.observable("Davey Jones");
    }
});