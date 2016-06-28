var serverService = require('../../../services/server_service');
var utils = require('../../../utils');
var bind = require('../../../binder');

module.exports = function() {
    var self = this;

    var binder = bind(self)
        .bind('healthCodeExportEnabled')
        .bind('emailVerificationEnabled');

    self.save = function(vm, event) {
        self.study = binder.persist(self.study);

        utils.startHandler(self, event);
        serverService.saveStudy(self.study, true)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler(vm, event));
    };

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .catch(utils.failureHandler());
};
