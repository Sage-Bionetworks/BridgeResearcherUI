import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import root from '../../root';
import utils from '../../utils';
import ko from 'knockout';
import alert from '../../widgets/alerts';

function modelToObs(map, context) {
    return Object.keys(map || {}).map(function(vendorId) {
        var obj = map[vendorId];
        obj.vendorId = vendorId;
        return obj;
    });
}
function obsToModel(array) {
    return array.reduce(function(map, obj) {
        map[obj.vendorId] = {
            clientId: obj.clientId,
            secret: obj.secret,
            endpoint: obj.endpoint,
            callbackUrl: obj.callbackUrl
        };
        return map;
    }, {});
}

module.exports = function() {
    var self = this;
    self.isPublicObs = root.isPublicObs;

    var binder = new Binder(self).bind('oAuthProviders[]', [], modelToObs, obsToModel);

    self.save = function(vm, event) {
        self.study = binder.persist(self.study);

        utils.startHandler(vm, event);
        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler());
    };
    self.removeProvider = function(element) {
        alert.deleteConfirmation("Do you want to delete this OAuth provider?", function() {
            self.oAuthProvidersObs.remove(element);
        });
    };
    self.addProvider = function() {
        root.openDialog('oauth_provider', {
            study: self.study, oAuthProvidersObs: self.oAuthProvidersObs});
    };
    self.editProvider = function(provider) {
        var index = self.oAuthProvidersObs().indexOf(provider);
        root.openDialog('oauth_provider', { index: index,
            study: self.study, oAuthProvidersObs: self.oAuthProvidersObs});
    };

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .catch(utils.failureHandler());
};