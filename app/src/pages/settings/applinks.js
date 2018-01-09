import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import ko from 'knockout';
import root from '../../root';
import utils from '../../utils';

function appleModelToObs(array, context) {
    return (array || []).map(function(obj) {
        return {
            appIdObs: ko.observable(obj.appID),
            pathsObs: ko.observableArray(obj.paths)
        };
    });
}
function appleObsToModel(array) {
    return array.map(function(obj) {
        return {
            appID: obj.appIdObs(),
            paths: obj.pathsObs()
        };
    });
}
function androidModelToObs(array, context) {
    return (array || []).map(function(obj) {
        return {
            namespaceObs: ko.observable(obj.namespace),
            packageNameObs: ko.observable(obj.package_name),
            fingerprintsObs: ko.observableArray(obj.sha256_cert_fingerprints)
        };
    });
}
function androidObsToModel(array) {
    return array.map(function(obj) {
        return {
            namespace: obj.namespaceObs(),
            package_name: obj.packageNameObs(),
            sha256_cert_fingerprints: obj.fingerprintsObs()
        };
    });
}
    
module.exports = function() {
    var self = this;

    var binder = new Binder(this)
        .bind('appleAppLinks[]', [], appleModelToObs, appleObsToModel)
        .bind('androidAppLinks[]', [], androidModelToObs, androidObsToModel)
        .obs('appleIndex')
        .obs('androidIndex');

    self.save = function(vm, event) {
        self.study = binder.persist(self.study);

        utils.startHandler(vm, event);
        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Study information saved."))
            .catch(utils.failureHandler());
    };
    self.removeAppleAppLink = function(element, event) {
        self.appleAppLinksObs.remove(element);
    };
    self.openAppleAppLinkEditor = function(element, event) {
        root.openDialog('edit_apple_link', {
            study: self.study, appleAppLinksObs: self.appleAppLinksObs});
    };
    self.pathFormatter = function(appleLink) {
        return appleLink.pathsObs().join(", ");
    };
    self.removeAndroidAppLink = function(element, event) {
        self.androidAppLinksObs.remove(element);
    };
    self.openAndroidAppLinkEditor = function(element, event) {
        root.openDialog('edit_android_link', {
            study: self.study, androidAppLinksObs: self.androidAppLinksObs});
    };
    self.fingerprintsFormatter = function(androidLink) {
        return androidLink.fingerprintsObs().map(function(fp) {
            return '<span title="'+fp+'">'+fp.substring(0,8) + "&hellip;</span>";
        }).join(", ");
    };

    serverService.getStudy()
        .then(binder.assign('study'))
        .then(binder.update())
        .catch(utils.failureHandler());
};