import ko from 'knockout';
import serverService from '../../services/server_service';
import utils from '../../utils';

module.exports = function() {
    var self = this;
    self.study = null;
    self.editor = null;
    
    self.subjectObs = ko.observable("");

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getStudy().then(function(study) {
            self.study = study;
            self.subjectObs(study.resetPasswordTemplate.subject);
            self.editor.setData(study.resetPasswordTemplate.body);
        });
    };

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study.resetPasswordTemplate.subject = self.subjectObs();
        self.study.resetPasswordTemplate.body = self.editor.getData();

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Email saved."))
            .catch(utils.failureHandler());
    };
};