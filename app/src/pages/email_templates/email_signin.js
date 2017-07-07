import ko from 'knockout';
import serverService from '../../services/server_service';
import utils from '../../utils';

module.exports = function() {
    var self = this;

    self.study = null;
    self.subjectObs = ko.observable("");
    self.editor = null;

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getStudy().then(function(study) {
            study.emailSignInTemplate = study.emailSignInTemplate || {};
            self.study = study;
            self.subjectObs(study.emailSignInTemplate.subject);
            self.editor.setData(study.emailSignInTemplate.body);
        }).catch(utils.failureHandler());
    };

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study.emailSignInTemplate.subject = self.subjectObs();
        self.study.emailSignInTemplate.body = self.editor.getData();

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Email saved."))
            .catch(utils.failureHandler());
    };
};