var define = require('../define');
var ko = require('knockout');

module.exports = function() {
    this.studyName = ko.observable("My Study Name");
};

/*
module.exports = define({
    init: function(params) {
        this.studyName = ko.observable("My Study Name");
    }
});*/