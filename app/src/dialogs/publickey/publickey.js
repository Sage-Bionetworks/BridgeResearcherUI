import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import root from '../../root';

module.exports = function(params) {
    let self = this;

    new Binder(self)
        .obs('downloadHref', params.study.identifier + ".pem")
        .obs('downloadFileName', '')
        .obs('content');
    self.close = root.closeDialog;

    serverService.getStudyPublicKey().then(function(response) {
        let fileContents = 'data:text/plain;charset=utf-8,' + encodeURIComponent(response.publicKey);
        self.contentObs(response.publicKey);
        self.downloadFileNameObs(fileContents);
    });
};
